// Pomotroid — single timer: Work (default 30) <-> Break (default 10)
// Ends with sound + notification, then STOPS and arms the next mode (no auto-start).
(function () {
  var mount = document.getElementById('pomotroid');
  if (!mount) return;

  function timo_local(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

  function timo_local_set(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

var savedWork = timo_local('timo_work');
var savedBreak = timo_local('timo_break');
var hadLocal = savedWork !== null || savedBreak !== null;

var workMin = parseInt(savedWork || '30', 10) || 30;
var breakMin = parseInt(savedBreak || '10', 10) || 10;

  var mode = 'work'; // 'work' | 'break'
  var total = workMin * 60;
  var left = total;
  var timer = null;

  mount.innerHTML =
    '<div class="pomo mode-work" id="pomoBox">' +
      '<span class="mode" id="pomoMode"></span>' +
      '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop class="grad-from" offset="0%" stop-color="var(--pomo)"/>' +
            '<stop class="grad-to" offset="100%" stop-color="var(--pomo-2)"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<circle class="track" cx="50" cy="50" r="44" fill="none" stroke-width="7"/>' +
        '<circle class="arc" id="pomoArc" cx="50" cy="50" r="44" fill="none" stroke-width="7" ' +
          'pathLength="100" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 50 50)"/>' +
      '</svg>' +
      '<div class="time" id="pomoTime">30:00</div>' +
      '<div class="state" id="pomoState"></div>' +
      '<div class="controls">' +
        '<button class="btn primary" id="pomoStart"></button>' +
        '<button class="btn ghost" id="pomoPause"></button>' +
        '<button class="btn ghost" id="pomoReset"></button>' +
        '<button class="btn ghost" id="pomoSkip"></button>' +
      '</div>' +
      '<div class="settings">' +
        '<label><span data-l="work_min"></span><input id="pomoWorkIn" type="number" min="1" max="180"></label>' +
        '<label><span data-l="break_min"></span><input id="pomoBreakIn" type="number" min="1" max="60"></label>' +
      '</div>' +
    '</div>';

  var box = document.getElementById('pomoBox');
  var modeEl = document.getElementById('pomoMode');
  var timeEl = document.getElementById('pomoTime');
  var stateEl = document.getElementById('pomoState');
  var arc = document.getElementById('pomoArc');

  function labels() {
    document.getElementById('pomoStart').textContent = t('start');
    document.getElementById('pomoPause').textContent = t('pause');
    document.getElementById('pomoReset').textContent = t('reset');
    document.getElementById('pomoSkip').textContent = t('skip');
    mount.querySelector('[data-l="work_min"]').textContent = t('work_min');
    mount.querySelector('[data-l="break_min"]').textContent = t('break_min');
    document.getElementById('pomoWorkIn').value = workMin;
    document.getElementById('pomoBreakIn').value = breakMin;
  }

  function fmt(s) {
    var m = Math.floor(s / 60), sec = s % 60;
    return (m < 10 ? '0' + m : m) + ':' + (sec < 10 ? '0' + sec : sec);
  }

  function render() {
    var isWork = mode === 'work';
    modeEl.textContent = isWork ? t('work') : t('break');
    timeEl.textContent = fmt(left);
    box.className = 'pomo ' + (isWork ? 'mode-work' : 'mode-break') + (timer ? ' running' : '');
    var ratio = total ? left / total : 0;
    arc.style.strokeDashoffset = String(ratio * 100);
    arc.style.visibility = ratio >= 1 ? 'hidden' : 'visible';
    document.title = fmt(left) + ' — ' + modeEl.textContent;
  }

  function cache() {
    try {
      localStorage.setItem('timo_work', String(workMin));
      localStorage.setItem('timo_break', String(breakMin));
    } catch (e) {}
  }

  var inflight = Promise.resolve();

  function persist() {
    var body = new URLSearchParams();
    body.append('work_minutes', workMin);
    body.append('break_minutes', breakMin);
    var payload = body.toString();
    // Chained so two quick edits cannot reach the server out of order and leave the
    // older pair of values as the final one.
    inflight = inflight.then(function () {
      return fetch('api/settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload
      }).catch(function () {});
    });
    return inflight;
  }

  function beep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99].forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = f;
        o.start(ctx.currentTime + i * 0.18);
        o.stop(ctx.currentTime + i * 0.18 + 0.18);
      });
    } catch (e) {}
  }

  function notify(msg) {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Timo', { body: msg });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    } catch (e) {}
    // In-page fallback so the user always sees it
    stateEl.textContent = msg;
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function arm(mm, keepMsg) {
    mode = mm;
    total = (mm === 'work' ? workMin : breakMin) * 60;
    left = total;
    if (!keepMsg) stateEl.textContent = '';
    render();
  }

  function finish() {
    stop();
    beep();
    // arm() first (it clears the state line), then notify() writes the finish message
    if (mode === 'work') { arm('break', true); notify(t('work_done')); }
    else { arm('work', true); notify(t('break_done')); }
  }

  document.getElementById('pomoStart').onclick = function () {
    if (timer) return;
    stateEl.textContent = '';
    timer = setInterval(function () {
      left--;
      if (left <= 0) { finish(); return; }
      render();
    }, 1000);
    render();
  };
  document.getElementById('pomoPause').onclick = function () { stop(); render(); };
  document.getElementById('pomoReset').onclick = function () { stop(); arm(mode); };
  document.getElementById('pomoSkip').onclick = function () { stop(); arm(mode === 'work' ? 'break' : 'work'); };
  document.getElementById('pomoWorkIn').onchange = function (e) {
    workMin = Math.max(1, parseInt(e.target.value, 10) || 30);
    e.target.value = workMin;
    cache();
    persist();
    if (mode === 'work' && !timer) arm('work');
  };
  document.getElementById('pomoBreakIn').onchange = function (e) {
    breakMin = Math.max(1, parseInt(e.target.value, 10) || 10);
    e.target.value = breakMin;
    cache();
    persist();
    if (mode === 'break' && !timer) arm('break');
  };

  labels();
  arm('work');

  fetch('api/settings.php')
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res || res.ok === false) return;
      // On the very first sync a local choice is pushed up, then flagged as synced so
      // that later loads follow the server. Pushing on every load would let one stale
      // browser pin its value to the database forever.
      if (hadLocal && !timo_local('timo_synced')) {
        timo_local_set('timo_synced', '1');
        persist();
        return;
      }
      var w = parseInt(res.work_minutes, 10);
      var b = parseInt(res.break_minutes, 10);
      if (!w || !b) return;
      workMin = w;
      breakMin = b;
      document.getElementById('pomoWorkIn').value = w;
      document.getElementById('pomoBreakIn').value = b;
      cache();
      if (!timer) arm(mode);
    })
    .catch(function () {});
})();