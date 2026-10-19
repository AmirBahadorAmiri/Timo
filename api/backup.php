<?php
// api/backup.php — export the whole workspace (apps + folders + tasks) to a JSON
// file, or import such a file back into the database.
//   GET  -> downloads a .json backup
//   POST -> imports an uploaded .json backup (mode: merge | replace)
require_once __DIR__ . '/../config/config.php';

const TIMO_BACKUP_FORMAT = 1;
const TIMO_BACKUP_MAX_BYTES = 33554432; // 32 MB
const TIMO_BACKUP_MIME = [
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'svg' => 'image/svg+xml',
];

/** Slug for a folder name — same rule as api/folders.php, with a safe fallback. */
function timo_backup_slug(string $name): string
{
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
    return $slug === '' ? 'general' : $slug;
}

/** Normalises a timestamp coming from a backup file to a MySQL DATETIME. */
function timo_backup_moment(?string $raw): ?string
{
    if (!is_string($raw) || trim($raw) === '') {
        return null;
    }
    $ts = strtotime($raw);
    return $ts === false ? null : date('Y-m-d H:i:s', $ts);
}

/** Reads a stored logo and returns it as a base64 data URI, or null. */
function timo_backup_read_logo(string $logo): ?string
{
    if (!preg_match('#^uploads/[A-Za-z0-9]+\.[a-z0-9]+$#', $logo)) {
        return null;
    }
    $path = dirname(__DIR__) . '/' . $logo;
    if (!is_file($path)) {
        return null;
    }
    $ext = strtolower(pathinfo($logo, PATHINFO_EXTENSION));
    $mime = TIMO_BACKUP_MIME[$ext] ?? 'application/octet-stream';
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') {
        return null;
    }
    return 'data:' . $mime . ';base64,' . base64_encode($raw);
}

/** Writes a base64 data URI into uploads/ and returns its web path, or null. */
function timo_backup_write_logo(string $dataUri, string $source): ?string
{
    if (!preg_match('#^data:([a-z0-9.+/-]+);base64,(.*)$#i', $dataUri, $m)) {
        return null;
    }
    $ext = timo_logo_ext(strtolower($m[1]));
    if ($ext === null) {
        $srcExt = strtolower(pathinfo($source, PATHINFO_EXTENSION));
        $ext = isset(TIMO_BACKUP_MIME[$srcExt]) ? $srcExt : null;
    }
    if ($ext === null) {
        return null;
    }
    $bin = base64_decode($m[2], true);
    if ($bin === false || $bin === '') {
        return null;
    }
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    if (@file_put_contents(timo_upload_dir() . '/' . $name, $bin) === false) {
        return null;
    }
    return 'uploads/' . $name;
}

/** Builds the full backup payload: applications -> folders -> tasks + logos. */
function timo_backup_export(PDO $db): array
{
    $apps = $db->query('SELECT id, name, logo, created_at FROM applications ORDER BY id ASC')->fetchAll();
    $folders = $db->query('SELECT id, application_id, name, slug, created_at FROM folders ORDER BY id ASC')->fetchAll();
    $tasks = $db->query(
        'SELECT id, folder_id, title, description, status, priority, created_at, updated_at FROM tasks ORDER BY id ASC'
    )->fetchAll();

    $tasksByFolder = [];
    foreach ($tasks as $task) {
        $tasksByFolder[(int) $task['folder_id']][] = [
            'title' => $task['title'],
            'description' => (string) ($task['description'] ?? ''),
            'status' => $task['status'],
            'priority' => $task['priority'],
            'created_at' => $task['created_at'],
            'updated_at' => $task['updated_at'],
        ];
    }

    $foldersByApp = [];
    foreach ($folders as $folder) {
        $foldersByApp[(int) $folder['application_id']][] = [
            'name' => $folder['name'],
            'slug' => $folder['slug'],
            'created_at' => $folder['created_at'],
            'tasks' => $tasksByFolder[(int) $folder['id']] ?? [],
        ];
    }

    $logos = [];
    $appList = [];
    foreach ($apps as $app) {
        $logo = $app['logo'] ?: null;
        if ($logo !== null && !isset($logos[$logo])) {
            $data = timo_backup_read_logo($logo);
            if ($data !== null) {
                $logos[$logo] = $data;
            }
        }
        $appList[] = [
            'name' => $app['name'],
            'logo' => $logo,
            'created_at' => $app['created_at'],
            'folders' => $foldersByApp[(int) $app['id']] ?? [],
        ];
    }

    return [
        'app' => 'timo',
        'format' => TIMO_BACKUP_FORMAT,
        'exported_at' => date('c'),
        'counts' => [
            'applications' => count($apps),
            'folders' => count($folders),
            'tasks' => count($tasks),
        ],
        'applications' => $appList,
        'logos' => $logos,
    ];
}

/**
 * Inserts a backup payload into the database.
 * merge   -> reuse applications/folders that already exist (same name), append tasks
 * replace -> wipe applications/folders/tasks first, then insert the file as-is
 */
function timo_backup_import(PDO $db, array $data, string $mode): array
{
    $apps = $data['applications'] ?? null;
    if (!is_array($apps)) {
        timo_json(['ok' => false, 'error' => 'invalid_backup'], 422);
    }
    $format = isset($data['format']) ? (int) $data['format'] : TIMO_BACKUP_FORMAT;
    if ($format > TIMO_BACKUP_FORMAT) {
        timo_json(['ok' => false, 'error' => 'invalid_backup'], 422);
    }
    $logoMap = is_array($data['logos'] ?? null) ? $data['logos'] : [];

    $db->beginTransaction();
    try {
        if ($mode === 'replace') {
            $oldLogos = $db->query('SELECT logo FROM applications WHERE logo IS NOT NULL AND logo <> ""')->fetchAll();
            $db->exec('DELETE FROM tasks');
            $db->exec('DELETE FROM folders');
            $db->exec('DELETE FROM applications');
            foreach ($oldLogos as $row) {
                timo_delete_logo($row['logo']);
            }
        }

        $counts = ['applications' => 0, 'folders' => 0, 'tasks' => 0];

        foreach ($apps as $app) {
            if (!is_array($app)) {
                continue;
            }
            $name = trim((string) ($app['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $appId = 0;
            $currentLogo = null;
            if ($mode === 'merge') {
                $st = $db->prepare('SELECT id, logo FROM applications WHERE name = ? LIMIT 1');
                $st->execute([$name]);
                $existing = $st->fetch();
                if ($existing) {
                    $appId = (int) $existing['id'];
                    $currentLogo = $existing['logo'];
                }
            }

            $source = is_string($app['logo'] ?? null) ? $app['logo'] : '';
            $logo = null;
            if ($source !== '' && isset($logoMap[$source]) && is_string($logoMap[$source])) {
                $logo = timo_backup_write_logo($logoMap[$source], $source);
            }
            if ($logo === null && $appId > 0) {
                $logo = $currentLogo; // merge keeps the logo that is already there
            }

            if ($appId > 0) {
                if ($logo !== $currentLogo) {
                    $db->prepare('UPDATE applications SET logo = ? WHERE id = ?')->execute([$logo, $appId]);
                    if ($currentLogo) {
                        timo_delete_logo($currentLogo);
                    }
                }
            } else {
                $st = $db->prepare(
                    'INSERT INTO applications (name, logo, created_at) VALUES (?,?,COALESCE(?, CURRENT_TIMESTAMP))'
                );
                $st->execute([$name, $logo, timo_backup_moment($app['created_at'] ?? null)]);
                $appId = (int) $db->lastInsertId();
                $counts['applications']++;
            }

            foreach ((array) ($app['folders'] ?? []) as $folder) {
                if (!is_array($folder)) {
                    continue;
                }
                $folderName = trim((string) ($folder['name'] ?? ''));
                if ($folderName === '') {
                    continue;
                }

                $folderId = 0;
                if ($mode === 'merge') {
                    $st = $db->prepare('SELECT id FROM folders WHERE application_id = ? AND name = ? LIMIT 1');
                    $st->execute([$appId, $folderName]);
                    $existingFolder = $st->fetch();
                    if ($existingFolder) {
                        $folderId = (int) $existingFolder['id'];
                    }
                }

                if ($folderId === 0) {
                    $slug = trim((string) ($folder['slug'] ?? '')) ?: timo_backup_slug($folderName);
                    $st = $db->prepare(
                        'INSERT INTO folders (application_id, name, slug, created_at) VALUES (?,?,?,COALESCE(?, CURRENT_TIMESTAMP))'
                    );
                    $st->execute([$appId, $folderName, $slug, timo_backup_moment($folder['created_at'] ?? null)]);
                    $folderId = (int) $db->lastInsertId();
                    $counts['folders']++;
                }

                foreach ((array) ($folder['tasks'] ?? []) as $task) {
                    if (!is_array($task)) {
                        continue;
                    }
                    $title = trim((string) ($task['title'] ?? ''));
                    if ($title === '') {
                        continue;
                    }
                    $status = (string) ($task['status'] ?? 'todo');
                    if (!in_array($status, ['todo', 'doing', 'done'], true)) {
                        $status = 'todo';
                    }
                    $priority = (string) ($task['priority'] ?? 'medium');
                    if (!in_array($priority, ['low', 'medium', 'high'], true)) {
                        $priority = 'medium';
                    }
                    $st = $db->prepare(
                        'INSERT INTO tasks (folder_id, title, description, status, priority, created_at, updated_at)
                         VALUES (?,?,?,?,?,COALESCE(?, CURRENT_TIMESTAMP),COALESCE(?, CURRENT_TIMESTAMP))'
                    );
                    $st->execute([
                        $folderId,
                        $title,
                        (string) ($task['description'] ?? ''),
                        $status,
                        $priority,
                        timo_backup_moment($task['created_at'] ?? null),
                        timo_backup_moment($task['updated_at'] ?? null),
                    ]);
                    $counts['tasks']++;
                }
            }
        }

        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }

    return ['mode' => $mode] + $counts;
}

try {
    $db = timo_db();
    $method = strtoupper((string) ($_GET['_method'] ?? $_POST['_method'] ?? $_SERVER['REQUEST_METHOD']));

    if ($method === 'POST') {
        $mode = (($_POST['mode'] ?? 'merge') === 'replace') ? 'replace' : 'merge';

        $file = $_FILES['file'] ?? null;
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if (!$file || $error === UPLOAD_ERR_NO_FILE) {
            timo_json(['ok' => false, 'error' => 'file_required'], 422);
        }
        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            timo_json(['ok' => false, 'error' => 'file_too_big'], 422);
        }
        if ($error !== UPLOAD_ERR_OK) {
            timo_json(['ok' => false, 'error' => 'file_upload_failed'], 422);
        }
        if ((int) ($file['size'] ?? 0) > TIMO_BACKUP_MAX_BYTES) {
            timo_json(['ok' => false, 'error' => 'file_too_big'], 422);
        }

        $raw = @file_get_contents($file['tmp_name']);
        if ($raw === false || trim($raw) === '') {
            timo_json(['ok' => false, 'error' => 'invalid_json'], 422);
        }
        $data = json_decode($raw, true);
        if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
            timo_json(['ok' => false, 'error' => 'invalid_json'], 422);
        }

        $result = timo_backup_import($db, $data, $mode);
        timo_json(['ok' => true] + $result);
    }

    $payload = timo_backup_export($db);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        timo_json(['ok' => false, 'error' => 'export_failed'], 500);
    }
    $filename = 'timo-backup-' . date('Y-m-d-Hi') . '.json';
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($json));
    header('Cache-Control: no-store');
    echo $json;
    exit;
} catch (Throwable $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    timo_json(['ok' => false, 'error' => $e->getMessage()], 500);
}
