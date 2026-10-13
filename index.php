<?php
// Timo dashboard
$lang = $_GET['lang'] ?? $_COOKIE['timo_lang'] ?? 'fa';
if (!in_array($lang, ['fa', 'en'], true)) {
    $lang = 'fa';
}
setcookie('timo_lang', $lang, time() + 86400 * 30, '/');
$t = require __DIR__ . '/lang/' . $lang . '.php';
$dir = $lang === 'fa' ? 'rtl' : 'ltr';
$otherLang = $lang === 'fa' ? 'en' : 'fa';
?>
<!DOCTYPE html>
<html lang="<?= $lang ?>" dir="<?= $dir ?>" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($t['app_name']) ?> — <?= htmlspecialchars($t['dashboard']) ?></title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='56' r='32' fill='none' stroke='%236366f1' stroke-width='10'/><path d='M38 8h24' stroke='%236366f1' stroke-width='10' stroke-linecap='round'/><path d='M50 40v17l11 7' stroke='%236366f1' stroke-width='9' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/pomotroid.css">
</head>
<body>
<header class="topbar">
  <div class="brand">
    <span class="logo">⏱</span>
    <span>
      <?= htmlspecialchars($t['app_name']) ?>
      <span class="sub"><?= htmlspecialchars($t['dashboard']) ?></span>
    </span>
  </div>
  <div class="top-actions">
    <a class="btn ghost" href="?lang=<?= $otherLang ?>"><?= $lang === 'fa' ? 'EN' : 'فا' ?></a>
    <button class="btn ghost icon-btn" id="themeBtn" type="button" title="Theme">🌙</button>
  </div>
</header>

<main class="layout">
  <!-- LEFT: task manager -->
  <section class="panel tasks-panel">
    <div class="board">

      <aside class="app-rail">
        <h2 class="rail-head">
          <span class="dot"></span>
          <?= htmlspecialchars($t['applications']) ?>
        </h2>
        <button type="button" class="rail-add" id="appAdd" title="<?= htmlspecialchars($t['add_application']) ?>"><span>+</span></button>
        <ul id="appList" class="rail-list"></ul>
        <div class="empty rail-empty" id="appEmpty"><span class="ico">📦</span><span><?= htmlspecialchars($t['empty_apps']) ?></span></div>
      </aside>

      <div class="cols2">

        <div class="col">
          <h2><span class="dot"></span><?= htmlspecialchars($t['folders']) ?></h2>
          <form id="folderForm" class="row" autocomplete="off">
            <input name="name" placeholder="<?= htmlspecialchars($t['folder_name_ph']) ?>" required>
            <button class="btn" type="submit"><?= htmlspecialchars($t['add']) ?></button>
          </form>
          <ul id="folderList" class="list"></ul>
          <div class="empty" id="folderEmpty"><span class="ico">📁</span><span><?= htmlspecialchars($t['empty_folders']) ?></span></div>
        </div>

        <div class="col tasks-col">
          <h2><span class="dot"></span><?= htmlspecialchars($t['tasks']) ?><span class="count" id="taskCount">0</span><button type="button" class="sort-btn" id="taskSort" title="<?= htmlspecialchars($t['sort']) ?>" aria-label="<?= htmlspecialchars($t['sort']) ?>">⇅</button></h2>
          <button type="button" class="btn add-task" id="taskAdd">
            <span aria-hidden="true">+</span><?= htmlspecialchars($t['new_task']) ?>
          </button>
          <ul id="taskList" class="list"></ul>
          <div class="empty" id="taskEmpty"><span class="ico">✅</span><span><?= htmlspecialchars($t['empty_tasks']) ?></span></div>
        </div>

      </div>
    </div>
  </section>

  <!-- RIGHT: clock (top) + pomotroid (bottom) -->
  <aside class="panel tools-panel">
    <div id="clockBox" class="card clock-card"></div>
    <div id="pomotroid"></div>
  </aside>
</main>

<script>
window.TIMO_I18N = <?= json_encode($t, JSON_UNESCAPED_UNICODE) ?>;
window.TIMO_LANG = <?= json_encode($lang) ?>;
</script>
<script src="assets/js/i18n.js"></script>
<script src="assets/js/modal.js"></script>
<script src="assets/js/contextmenu.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/pomotroid.js"></script>
<script src="assets/js/widgets.js"></script>
</body>
</html>