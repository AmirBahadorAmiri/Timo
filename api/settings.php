<?php
// api/settings.php — read/update the pomotroid work & break minutes
require_once __DIR__ . '/../config/config.php';

const TIMO_USER_KEY = 'default';

function timo_settings(PDO $db): array
{
    $st = $db->prepare('SELECT work_minutes, break_minutes FROM settings WHERE user_key = ?');
    $st->execute([TIMO_USER_KEY]);
    $row = $st->fetch();
    if ($row) {
        return $row;
    }
    $db->prepare('INSERT IGNORE INTO settings (user_key, work_minutes, break_minutes) VALUES (?, 30, 10)')
        ->execute([TIMO_USER_KEY]);
    return ['work_minutes' => 30, 'break_minutes' => 10];
}

try {
    $db = timo_db();
    $current = timo_settings($db);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $work = isset($_POST['work_minutes']) ? (int) $_POST['work_minutes'] : (int) $current['work_minutes'];
        $brk = isset($_POST['break_minutes']) ? (int) $_POST['break_minutes'] : (int) $current['break_minutes'];
        if ($work < 1 || $work > 180 || $brk < 1 || $brk > 60) {
            timo_json(['ok' => false, 'error' => 'work_minutes must be 1-180, break_minutes 1-60'], 422);
        }
        $up = $db->prepare(
            'INSERT INTO settings (user_key, work_minutes, break_minutes) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE work_minutes = VALUES(work_minutes), break_minutes = VALUES(break_minutes)'
        );
        $up->execute([TIMO_USER_KEY, $work, $brk]);
        timo_json(['ok' => true, 'work_minutes' => $work, 'break_minutes' => $brk]);
    }

    timo_json(array_merge(['ok' => true], $current));
} catch (Throwable $e) {
    timo_json(['ok' => false, 'error' => $e->getMessage()], 500);
}