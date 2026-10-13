<?php
// Timo - shared DB config (XAMPP defaults: user root, empty password)
const TIMO_DB_HOST = 'localhost';
const TIMO_DB_NAME = 'timo';
const TIMO_DB_USER = 'root';
const TIMO_DB_PASS = '';

function timo_db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = 'mysql:host=' . TIMO_DB_HOST . ';dbname=' . TIMO_DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, TIMO_DB_USER, TIMO_DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}

function timo_json($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

const TIMO_LOGO_MAX_BYTES = 524288;

function timo_upload_dir(): string {
    return dirname(__DIR__) . '/uploads';
}

function timo_logo_ext(string $mime): ?string {
    $map = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'image/svg+xml' => 'svg',
    ];
    return $map[$mime] ?? null;
}

/** Stores an uploaded logo and returns its web path, or null when no file was sent. */
function timo_save_logo(?array $file): ?string {
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return null;
    }
    if ($file['size'] < 1 || $file['size'] > TIMO_LOGO_MAX_BYTES) {
        timo_json(['ok' => false, 'error' => 'logo_too_big'], 422);
    }
    if (!function_exists('finfo_open')) {
        timo_json(['ok' => false, 'error' => 'fileinfo_missing'], 500);
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = (string) finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    $ext = timo_logo_ext($mime);
    if ($ext === null) {
        timo_json(['ok' => false, 'error' => 'logo_bad_type'], 422);
    }
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], timo_upload_dir() . '/' . $name)) {
        timo_json(['ok' => false, 'error' => 'logo_save_failed'], 500);
    }
    return 'uploads/' . $name;
}

function timo_delete_logo(?string $logo): void {
    if (!$logo || !preg_match('#^uploads/[A-Za-z0-9]+\.[a-z0-9]+$#', $logo)) {
        return;
    }
    $path = dirname(__DIR__) . '/' . $logo;
    if (is_file($path)) {
        @unlink($path);
    }
}
