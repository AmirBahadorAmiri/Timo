// Theme toggle + task manager wiring (vanilla JS)
(function () {
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Theme ----------
  function applyTheme(next) {
    root.setAttribute('data-theme', next);
    $('themeBtn').textContent = next === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('timo_theme', next); } catch (e) {}
  }
  try {
    var saved = localStorage.getItem('timo_theme');
    applyTheme(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  } catch (e) { applyTheme('light'); }
  $('themeBtn').addEventListener('click', function () {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // ---------- Task manager state ----------
  var state = { appId: 0, folderId: 0 };
  var API = 'api/';

  // Sorted client-side on the loaded rows so switching never re-queries the API.
  var PRIO_RANK = { high: 0, medium: 1, low: 2 };
  var STATUS_RANK = { doing: 0, todo: 1, done: 2 };
  var SORTS = [
    { key: 'new', lang: 'sort_new', cmp: function (a, b) { return b.id - a.id; } },
    { key: 'old', lang: 'sort_old', cmp: function (a, b) { return a.id - b.id; } },
    {
      key: 'prio', lang: 'sort_prio',
      cmp: function (a, b) { return (PRIO_RANK[a.priority] - PRIO_RANK[b.priority]) || (b.id - a.id); }
    },
    {
      key: 'status', lang: 'sort_status',
      cmp: function (a, b) { return (STATUS_RANK[a.status] - STATUS_RANK[b.status]) || (b.id - a.id); }
    },
    {
      key: 'alpha', lang: 'sort_alpha',
      cmp: function (a, b) { return String(a.title || '').localeCompare(String(b.title || ''), window.TIMO_LANG || undefined, { numeric: true }); }
    }
  ];

  state.sort = 'new';
  try {
    var savedSort = localStorage.getItem('timo_sort');
    if (savedSort) SORTS.forEach(function (s) { if (s.key === savedSort) state.sort = savedSort; });
  } catch (e) {}

  function currentSort() {
    for (var i = 0; i < SORTS.length; i++) if (SORTS[i].key === state.sort) return SORTS[i];
    return SORTS[0];
  }

  function sortMenu() {
    return SORTS.map(function (s) {
      return {
        icon: state.sort === s.key ? '✓' : '',
        label: t(s.lang),
        onSelect: function () {
          state.sort = s.key;
          try { localStorage.setItem('timo_sort', s.key); } catch (e) {}
          loadTasks();
        }
      };
    });
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('hide'); }, 3200);
    setTimeout(function () { el.remove(); }, 3800);
  }

  function fetchJSON(url, opts) {
    return fetch(url, opts)
      .then(function (r) {
        return r.json().catch(function () { throw new Error('HTTP ' + r.status); });
      })
      .catch(function (err) {
        toast(t('error') + ': ' + err.message);
        return { ok: false, data: [] };
      })
      .then(function (res) {
        if (res && res.ok === false && res.error) toast(res.error);
        return res;
      });
  }

  // ---------- Floating name tooltip (body-level so the rail scroller can't clip it) ----------
  var tip = document.createElement('div');
  tip.className = 'tip';
  document.body.appendChild(tip);

  function showTip(text, ev) {
    tip.textContent = text;
    tip.classList.add('show');
    moveTip(ev);
  }
  function moveTip(ev) {
    var pad = 12;
    var r = tip.getBoundingClientRect();
    var left = ev.clientX - r.width / 2;
    var top = ev.clientY - r.height - 14;
    if (top < pad) top = ev.clientY + 18;
    tip.style.left = Math.max(pad, Math.min(left, window.innerWidth - r.width - pad)) + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() { tip.classList.remove('show'); }

  // ---------- Helpers ----------
  function firstLetter(name) {
    return (name || '?').trim().charAt(0).toUpperCase() || '?';
  }
  function dotGradient(id) {
  var h = (Number(id) * 47) % 360;
  var a = 'hsl(' + h + ',68%,50%)';
  var b = 'hsl(' + ((h + 42) % 360) + ',70%,38%)';
    return { css: 'linear-gradient(135deg,' + a + ' 0%,' + b + ' 100%)', base: b };
  }
  function moreButton(onOpen) {
    var b = document.createElement('button');
    b.className = 'icon-btn';
    b.type = 'button';
    b.textContent = '⋯';
    b.onclick = function (ev) {
      ev.stopPropagation();
      var r = b.getBoundingClientRect();
      onOpen(r.left, r.bottom + 6);
    };
    return b;
  }

  // ---------- Applications rail ----------
  function appFormFields(a) {
    var fields = [
      { name: 'name', label: t('name'), type: 'text', required: true, placeholder: t('app_name_ph'), value: a ? a.name : '' }
    ];
    if (a) {
      fields.push({ name: 'logo', label: t('logo'), type: 'file', hint: t('replace_logo') });
      fields.push({ name: 'remove_logo', label: t('remove_logo'), type: 'checkbox' });
    } else {
      fields.push({ name: 'logo', label: t('logo'), type: 'file', hint: t('choose_image') });
    }
    return fields;
  }

  function addApp() {
    openModal({ title: t('new_application'), submitText: t('add'), fields: appFormFields(null) })
      .then(function (fd) {
        if (!fd) return null;
        return fetchJSON(API + 'applications.php', { method: 'POST', body: fd });
      })
      .then(function (res) { if (res && res.ok) loadApps(); });
  }

  function editApp(a) {
    openModal({ title: t('rename_app'), submitText: t('save'), fields: appFormFields(a) })
      .then(function (fd) {
        if (!fd) return null;
        return fetchJSON(API + 'applications.php?_method=PATCH&id=' + a.id, { method: 'POST', body: fd });
      })
      .then(function (res) { if (res && res.ok) loadApps(); });
  }

  function deleteApp(a) {
    confirmBox(a.name).then(function (ok) {
      if (!ok) return;
      fetchJSON(API + 'applications.php?_method=DELETE&id=' + a.id).then(function () {
        if (state.appId === a.id) { state.appId = 0; state.folderId = 0; }
        loadApps(); loadFolders(); loadTasks();
      });
    });
  }

  function appMenu(a) {
    return [
      { icon: '✏️', label: t('rename_app'), onSelect: function () { editApp(a); } },
      '-',
      { icon: '🗑️', label: t('delete_app'), danger: true, onSelect: function () { deleteApp(a); } }
    ];
  }

  function paintDot(dot, a) {
    var g = dotGradient(a.id);
    dot.style.backgroundColor = g.base;
    dot.style.backgroundImage = g.css;
    dot.textContent = firstLetter(a.name);
  }

  function loadApps() {
    fetchJSON(API + 'applications.php').then(function (res) {
      var rows = res.data || [];
      var ul = $('appList');
      ul.innerHTML = '';
      rows.forEach(function (a) {
        var li = document.createElement('li');
        li.className = 'rail-item' + (a.id === state.appId ? ' active' : '');

        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'app-dot';
        if (a.logo) {
          var img = document.createElement('img');
          img.src = a.logo;
          img.alt = '';
          img.loading = 'lazy';
          img.onerror = function () { paintDot(dot, a); };
          dot.appendChild(img);
        } else {
          paintDot(dot, a);
        }

        dot.onclick = function () {
          state.appId = a.id; state.folderId = 0;
          loadApps(); loadFolders(); loadTasks();
        };
        dot.onmouseenter = function (ev) { showTip(a.name, ev); };
        dot.onmousemove = moveTip;
        dot.onmouseleave = hideTip;
        dot.oncontextmenu = function (ev) {
          ev.preventDefault();
          hideTip();
          TimoMenu.open(ev.clientX, ev.clientY, appMenu(a));
        };

        li.appendChild(dot);
        li.appendChild(moreButton(function (x, y) { TimoMenu.open(x, y, appMenu(a)); }));
        ul.appendChild(li);
      });
      $('appEmpty').style.display = rows.length ? 'none' : '';
    });
  }

  // ---------- Folders ----------
  function editFolder(f) {
    openModal({
      title: t('rename_folder'),
      submitText: t('save'),
      fields: [{ name: 'name', label: t('name'), type: 'text', required: true, placeholder: t('folder_name_ph'), value: f.name }]
    }).then(function (fd) {
      if (!fd) return null;
      return fetchJSON(API + 'folders.php?_method=PATCH&id=' + f.id, { method: 'POST', body: fd });
    }).then(function (res) { if (res && res.ok) loadFolders(); });
  }

  function deleteFolder(f) {
    confirmBox(f.name).then(function (ok) {
      if (!ok) return;
      fetchJSON(API + 'folders.php?_method=DELETE&id=' + f.id).then(function () {
        if (state.folderId === f.id) state.folderId = 0;
        loadFolders(); loadTasks();
      });
    });
  }

  function folderMenu(f) {
    return [
      { icon: '✏️', label: t('rename_folder'), onSelect: function () { editFolder(f); } },
      '-',
      { icon: '🗑️', label: t('delete_folder'), danger: true, onSelect: function () { deleteFolder(f); } }
    ];
  }

  function loadFolders() {
    if (!state.appId) {
      $('folderList').innerHTML = '';
      $('folderEmpty').style.display = '';
      return;
    }
    fetchJSON(API + 'folders.php?application_id=' + state.appId).then(function (res) {
      var rows = res.data || [];
      var ul = $('folderList');
      ul.innerHTML = '';
      rows.forEach(function (f) {
        var li = document.createElement('li');
        li.className = 'item' + (f.id === state.folderId ? ' active' : '');

        var ico = document.createElement('span');
        ico.textContent = '📁';
        var span = document.createElement('span');
        span.className = 'label';
        span.textContent = f.name;

        var more = document.createElement('button');
        more.className = 'icon-btn';
        more.type = 'button';
        more.textContent = '⋯';
        more.onclick = function (ev) {
          ev.stopPropagation();
          var r = more.getBoundingClientRect();
          TimoMenu.open(r.left, r.bottom + 6, folderMenu(f));
        };

        li.appendChild(ico);
        li.appendChild(span);
        li.appendChild(more);
        li.onclick = function () { state.folderId = f.id; loadFolders(); loadTasks(); };
        li.oncontextmenu = function (ev) {
          ev.preventDefault();
          TimoMenu.open(ev.clientX, ev.clientY, folderMenu(f));
        };
        ul.appendChild(li);
      });
      $('folderEmpty').style.display = rows.length ? 'none' : '';
    });
  }

  // ---------- Tasks ----------
  function setStatus(task, status) {
    fetchJSON(API + 'tasks.php?_method=PATCH&id=' + task.id + '&status=' + status).then(loadTasks);
  }

  function taskFormFields(task) {
    var k = task || null;
    return [
      {
        name: 'title', label: t('name'), type: 'text', required: true,
        placeholder: t('task_title_ph'), value: k ? k.title : ''
      },
      { name: 'description', label: t('description'), type: 'textarea', value: k ? (k.description || '') : '' },
      {
        name: 'priority', label: t('priority'), type: 'select', value: k ? k.priority : 'medium',
        options: [{ value: 'low', label: t('low') }, { value: 'medium', label: t('medium') }, { value: 'high', label: t('high') }]
      },
      {
        name: 'status', label: t('status'), type: 'select', value: k ? k.status : 'todo',
        options: [{ value: 'todo', label: t('todo') }, { value: 'doing', label: t('doing') }, { value: 'done', label: t('done') }]
      }
    ];
  }

  function addTask() {
    if (!state.folderId) { alert(t('empty_tasks')); return; }
    openModal({ title: t('new_task'), submitText: t('add'), fields: taskFormFields(null) })
      .then(function (fd) {
        if (!fd) return null;
        fd.append('folder_id', state.folderId);
        return fetchJSON(API + 'tasks.php', { method: 'POST', body: fd });
      })
      .then(function (res) { if (res && res.ok) loadTasks(); });
  }

  function editTask(task) {
    openModal({ title: t('edit_task'), submitText: t('save'), fields: taskFormFields(task) })
      .then(function (fd) {
        if (!fd) return null;
        fd.append('_method', 'PATCH');
        return fetchJSON(API + 'tasks.php?id=' + task.id, { method: 'POST', body: fd });
      })
      .then(function (res) { if (res && res.ok) loadTasks(); });
  }

  function deleteTask(task) {
    confirmBox(task.title).then(function (ok) {
      if (!ok) return;
      fetchJSON(API + 'tasks.php?_method=DELETE&id=' + task.id).then(loadTasks);
    });
  }

  function taskMenu(task) {
    return [
      { icon: '✏️', label: t('edit_task'), onSelect: function () { editTask(task); } },
      '-',
      { icon: '○', label: t('mark_todo'), onSelect: function () { setStatus(task, 'todo'); } },
      { icon: '◐', label: t('mark_doing'), onSelect: function () { setStatus(task, 'doing'); } },
      { icon: '●', label: t('mark_done'), onSelect: function () { setStatus(task, 'done'); } },
      '-',
      { icon: '🗑️', label: t('delete_task'), danger: true, onSelect: function () { deleteTask(task); } }
    ];
  }

  function renderEmptyList(listId, emptyId, countId) {
    $(listId).innerHTML = '';
    $(emptyId).style.display = '';
    $(countId).textContent = 0;
  }

  function loadTasks() {
    if (!state.folderId) {
      renderEmptyList('taskList', 'taskEmpty', 'taskCount');
      return;
    }
    fetchJSON(API + 'tasks.php?folder_id=' + state.folderId).then(function (res) {
      var rows = (res.data || []).slice();
      rows.sort(currentSort().cmp);
      var ul = $('taskList');
      ul.innerHTML = '';
      rows.forEach(function (task) {
        var li = document.createElement('li');
        li.className = 'item task-item';

        var prio = document.createElement('span');
        prio.className = 'prio ' + task.priority;
        prio.title = t(task.priority);

        var body = document.createElement('div');
        body.className = 'task-body';

        var span = document.createElement('span');
        span.className = 'label';
        span.textContent = task.title;
        body.appendChild(span);

        if (task.description) {
          var sub = document.createElement('span');
          sub.className = 'task-sub';
          sub.textContent = task.description;
          body.appendChild(sub);
        }

        var badge = document.createElement('span');
        badge.className = 'badge ' + task.status;
        var sdot = document.createElement('span');
        sdot.className = 'status-dot';
        badge.appendChild(sdot);
        badge.appendChild(document.createTextNode(t(task.status)));

        var done = document.createElement('button');
        done.className = 'icon-btn';
        done.type = 'button';
        done.title = t('done');
        done.textContent = '✓';
        done.onclick = function (ev) {
          ev.stopPropagation();
          setStatus(task, task.status === 'done' ? 'todo' : 'done');
        };

        var more = document.createElement('button');
        more.className = 'icon-btn';
        more.type = 'button';
        more.textContent = '⋯';
        more.onclick = function (ev) {
          ev.stopPropagation();
          var r = more.getBoundingClientRect();
          TimoMenu.open(r.left, r.bottom + 6, taskMenu(task));
        };

        li.appendChild(prio);
        li.appendChild(body);
        li.appendChild(badge);
        li.appendChild(done);
        li.appendChild(more);

        if (task.description) {
          var chev = document.createElement('span');
          chev.className = 'task-chev';
          chev.setAttribute('aria-hidden', 'true');
          chev.textContent = '⌄';
          li.appendChild(chev);
          li.classList.add('expandable');
          li.onclick = function () {
            li.classList.toggle('open');
          };
        }

        li.oncontextmenu = function (ev) {
          ev.preventDefault();
          TimoMenu.open(ev.clientX, ev.clientY, taskMenu(task));
        };
        ul.appendChild(li);
      });
      $('taskCount').textContent = rows.length;
      $('taskEmpty').style.display = rows.length ? 'none' : '';
    });
  }

  // ---------- Forms ----------
  $('appAdd').addEventListener('click', addApp);
  $('taskSort').addEventListener('click', function () {
    var r = this.getBoundingClientRect();
    TimoMenu.open(r.left, r.bottom + 6, sortMenu());
  });

  $('folderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!state.appId) { alert(t('empty_folders')); return; }
    var form = e.target;
    var fd = new FormData(form);
    fd.append('application_id', state.appId);
    fetchJSON(API + 'folders.php', { method: 'POST', body: fd }).then(function (res) { if (res && res.ok) { form.reset(); loadFolders(); } });
  });
  $('taskAdd').addEventListener('click', addTask);

  loadApps();
  loadFolders();
  loadTasks();
})();