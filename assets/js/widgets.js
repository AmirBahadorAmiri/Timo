// Sidebar clock/date widget (approved by Amir)
(function () {
  var isFa = window.TIMO_LANG === 'fa';

  // ---------- Clock ----------
  var clock = document.getElementById('clockBox');
  if (clock) {
    var h = document.createElement('h3');
    h.textContent = '🕐  ' + t('clock');

    var time = document.createElement('div');
    time.className = 'clock-time';

    var date = document.createElement('div');
    date.className = 'clock-date';

    clock.appendChild(h);
    clock.appendChild(time);
    clock.appendChild(date);

    var tick = function () {
      var now = new Date();
      time.textContent = now.toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      try {
        date.textContent = now.toLocaleDateString(isFa ? 'fa-IR' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (e) {
        date.textContent = now.toDateString();
      }
    };
    tick();
    setInterval(tick, 1000);
  }

})();
