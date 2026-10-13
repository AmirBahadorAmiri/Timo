<?php
// api/tasks.php — list by folder_id / create / update / delete
require_once __DIR__ . '/../config/config.php';

try {
    $db = timo_db();
    $method = $_GET['_method'] ?? $_POST['_method'] ?? $_SERVER['REQUEST_METHOD'];
    $method = strtoupper((string) $method);

    if ($method === 'POST') {
        $folderId = (int) ($_POST['folder_id'] ?? 0);
        $title = trim($_POST['title'] ?? '');
        if ($folderId <= 0 || $title === '') {
            timo_json(['ok' => false, 'error' => 'folder_id + title required'], 422);
        }
        $status = (string) ($_POST['status'] ?? 'todo');
        if (!in_array($status, ['todo', 'doing', 'done'], true)) {
            timo_json(['ok' => false, 'error' => 'invalid status'], 422);
        }
        $priority = (string) ($_POST['priority'] ?? 'medium');
        if (!in_array($priority, ['low', 'medium', 'high'], true)) {
            timo_json(['ok' => false, 'error' => 'invalid priority'], 422);
        }
        $st = $db->prepare('INSERT INTO tasks (folder_id, title, description, status, priority) VALUES (?,?,?,?,?)');
        $st->execute([$folderId, $title, trim($_POST['description'] ?? ''), $status, $priority]);
        timo_json(['ok' => true, 'id' => (int) $db->lastInsertId()]);
    }

    if ($method === 'PATCH') {
        parse_str(file_get_contents('php://input'), $raw);
        $in = array_merge($_GET, $_POST, $raw);
        $id = (int) ($in['id'] ?? 0);
        if ($id <= 0) {
            timo_json(['ok' => false, 'error' => 'id required'], 422);
        }
        $fields = [];
        $params = [];
        if (array_key_exists('title', $in)) {
            $title = trim((string) $in['title']);
            if ($title === '') {
                timo_json(['ok' => false, 'error' => 'title required'], 422);
            }
            $fields[] = 'title = ?';
            $params[] = $title;
        }
        if (array_key_exists('description', $in)) {
            $fields[] = 'description = ?';
            $params[] = trim((string) $in['description']);
        }
        if (array_key_exists('status', $in)) {
            $status = (string) $in['status'];
            if (!in_array($status, ['todo', 'doing', 'done'], true)) {
                timo_json(['ok' => false, 'error' => 'invalid status'], 422);
            }
            $fields[] = 'status = ?';
            $params[] = $status;
        }
        if (array_key_exists('priority', $in)) {
            $priority = (string) $in['priority'];
            if (!in_array($priority, ['low', 'medium', 'high'], true)) {
                timo_json(['ok' => false, 'error' => 'invalid priority'], 422);
            }
            $fields[] = 'priority = ?';
            $params[] = $priority;
        }
        if (!$fields) {
            timo_json(['ok' => false, 'error' => 'nothing to update'], 422);
        }
        $params[] = $id;
        $st = $db->prepare('UPDATE tasks SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $st->execute($params);
        timo_json(['ok' => true]);
    }

    if ($method === 'DELETE' || isset($_GET['delete'])) {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            timo_json(['ok' => false, 'error' => 'id required'], 422);
        }
        $st = $db->prepare('DELETE FROM tasks WHERE id = ?');
        $st->execute([$id]);
        timo_json(['ok' => true]);
    }

    $folderId = (int) ($_GET['folder_id'] ?? 0);
    if ($folderId > 0) {
        $st = $db->prepare('SELECT * FROM tasks WHERE folder_id = ? ORDER BY id DESC');
        $st->execute([$folderId]);
        timo_json(['ok' => true, 'data' => $st->fetchAll()]);
    }
    timo_json(['ok' => false, 'error' => 'folder_id required'], 422);
} catch (Throwable $e) {
    timo_json(['ok' => false, 'error' => $e->getMessage()], 500);
}