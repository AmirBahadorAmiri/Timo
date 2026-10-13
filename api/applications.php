<?php
// api/applications.php — list / create / rename / replace logo / delete
require_once __DIR__ . '/../config/config.php';

try {
    $db = timo_db();
    $method = $_GET['_method'] ?? $_POST['_method'] ?? $_SERVER['REQUEST_METHOD'];
    $method = strtoupper((string) $method);

    if ($method === 'POST') {
        $name = trim($_POST['name'] ?? '');
        if ($name === '') {
            timo_json(['ok' => false, 'error' => 'name_required'], 422);
        }
        $logo = timo_save_logo($_FILES['logo'] ?? null);
        $st = $db->prepare('INSERT INTO applications (name, logo) VALUES (?,?)');
        $st->execute([$name, $logo]);
        timo_json(['ok' => true, 'id' => (int) $db->lastInsertId(), 'logo' => $logo]);
    }

    if ($method === 'PATCH') {
        $id = (int) ($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT id, logo FROM applications WHERE id = ?');
        $st->execute([$id]);
        $current = $st->fetch();
        if (!$current) {
            timo_json(['ok' => false, 'error' => 'not_found'], 404);
        }
        $fields = [];
        $params = [];
        if (array_key_exists('name', $_POST)) {
            $name = trim((string) $_POST['name']);
            if ($name === '') {
                timo_json(['ok' => false, 'error' => 'name_required'], 422);
            }
            $fields[] = 'name = ?';
            $params[] = $name;
        }
        $logo = timo_save_logo($_FILES['logo'] ?? null);
        $dropLogo = ($_POST['remove_logo'] ?? '') === '1';
        $logoChanged = $logo !== null || $dropLogo;
        if ($logoChanged) {
            $fields[] = 'logo = ?';
            $params[] = $logo;
        }
        if ($fields) {
            $params[] = $id;
            $up = $db->prepare('UPDATE applications SET ' . implode(', ', $fields) . ' WHERE id = ?');
            $up->execute($params);
            if ($logoChanged) {
                timo_delete_logo($current['logo']);
            }
        }
        timo_json(['ok' => true, 'logo' => $logoChanged ? $logo : $current['logo']]);
    }

    if ($method === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            timo_json(['ok' => false, 'error' => 'id_required'], 422);
        }
        $st = $db->prepare('SELECT logo FROM applications WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) {
            timo_json(['ok' => false, 'error' => 'not_found'], 404);
        }
        $db->prepare('DELETE FROM applications WHERE id = ?')->execute([$id]);
        timo_delete_logo($row['logo']);
        timo_json(['ok' => true]);
    }

    $rows = $db->query('SELECT * FROM applications ORDER BY id DESC')->fetchAll();
    timo_json(['ok' => true, 'data' => $rows]);
} catch (Throwable $e) {
    timo_json(['ok' => false, 'error' => $e->getMessage()], 500);
}