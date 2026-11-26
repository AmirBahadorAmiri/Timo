// Clock widget — time only.
(function () {
  var clock = document.getElementById('clockBox');
  if (!clock) return;

  var isFa = window.TIMO_LANG === 'fa';
  var time = document.createElement('div');
  time.className = 'clock-time';
  clock.appendChild(time);

  function tick() {
    time.textContent = new Date().toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
  tick();
  setInterval(tick, 1000);
})();
