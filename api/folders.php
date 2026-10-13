<?php
// api/folders.php — list by application_id / create / rename / delete
require_once __DIR__ . '/../config/config.php';

try {
    $db = timo_db();
    $method = $_GET['_method'] ?? $_POST['_method'] ?? $_SERVER['REQUEST_METHOD'];
    $method = strtoupper((string) $method);

    if ($method === 'POST') {
        $appId = (int) ($_POST['application_id'] ?? 0);
        $name = trim($_POST['name'] ?? '');
        if ($appId <= 0 || $name === '') {
            timo_json(['ok' => false, 'error' => 'application_id + name required'], 422);
        }
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
        $st = $db->prepare('INSERT INTO folders (application_id, name, slug) VALUES (?,?,?)');
        $st->execute([$appId, $name, $slug]);
        timo_json(['ok' => true, 'id' => (int) $db->lastInsertId()]);
    }

    if ($method === 'PATCH') {
        $id = (int) ($_GET['id'] ?? 0);
        $name = trim($_POST['name'] ?? '');
        if ($id <= 0 || $name === '') {
            timo_json(['ok' => false, 'error' => 'id + name required'], 422);
        }
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
        $st = $db->prepare('UPDATE folders SET name = ?, slug = ? WHERE id = ?');
        $st->execute([$name, $slug, $id]);
        timo_json(['ok' => true]);
    }

    if ($method === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            timo_json(['ok' => false, 'error' => 'id_required'], 422);
        }
        $st = $db->prepare('DELETE FROM folders WHERE id = ?');
        $st->execute([$id]);
        timo_json(['ok' => true]);
    }

    $appId = (int) ($_GET['application_id'] ?? 0);
    if ($appId > 0) {
        $st = $db->prepare('SELECT * FROM folders WHERE application_id = ? ORDER BY id ASC');
        $st->execute([$appId]);
        timo_json(['ok' => true, 'data' => $st->fetchAll()]);
    }
    timo_json(['ok' => true, 'data' => $db->query('SELECT * FROM folders ORDER BY id DESC LIMIT 100')->fetchAll()]);
} catch (Throwable $e) {
    timo_json(['ok' => false, 'error' => $e->getMessage()], 500);
}