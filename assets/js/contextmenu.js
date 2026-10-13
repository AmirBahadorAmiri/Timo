// Custom right-click menu shared by applications, folders and tasks.
var TimoMenu = (function () {
  var el = null;
  var closer = [];

  function build() {
    el = document.createElement('div');
    el.className = 'ctx-menu';
    el.setAttribute('role', 'menu');
    document.body.appendChild(el);
    return el;
  }

  function close() {
    if (!el) return;
    el.innerHTML = '';
    el.style.display = 'none';
    while (closer.length) closer.pop()();
  }

  function open(x, y, items) {
    if (!el) build();
    close();

    items.forEach(function (it) {
      if (it === '-') {
        var sep = document.createElement('div');
        sep.className = 'ctx-sep';
        el.appendChild(sep);
        return;
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ctx-item' + (it.danger ? ' danger' : '');
      var ico = document.createElement('span');
      ico.className = 'ctx-ico';
      ico.textContent = it.icon || '';
      var txt = document.createElement('span');
      txt.className = 'ctx-text';
      txt.textContent = it.label;
      btn.appendChild(ico);
      btn.appendChild(txt);
      btn.onclick = function (ev) {
        ev.stopPropagation();
        close();
        it.onSelect();
      };
      el.appendChild(btn);
    });

    el.style.display = '';
    el.style.visibility = 'hidden';
    el.style.left = '0px';
    el.style.top = '0px';
    var r = el.getBoundingClientRect();
    var left = x + r.width > window.innerWidth - 8 ? x - r.width : x;
    var top = y + r.height > window.innerHeight - 8 ? y - r.height : y;
    el.style.left = Math.max(8, left) + 'px';
    el.style.top = Math.max(8, top) + 'px';
    el.style.visibility = 'visible';

    function onDoc(ev) {
      if (el.contains(ev.target)) return;
      close();
    }
    function onKey(ev) {
      if (ev.key === 'Escape') close();
    }
    document.addEventListener('pointerdown', onDoc, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    closer = [
      function () { document.removeEventListener('pointerdown', onDoc, true); },
      function () { document.removeEventListener('keydown', onKey); },
      function () { window.removeEventListener('blur', close); },
      function () { window.removeEventListener('resize', close); }
    ];
  }

  return { open: open, close: close };
})();