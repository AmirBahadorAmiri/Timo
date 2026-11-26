// Local, localStorage-backed replacement for the old PHP API.
// Intercepts only `api/*.php` requests so app.js keeps working unchanged.
(function () {
  var KEY = 'timo.data.v1';
  var nativeFetch = window.fetch.bind(window);

  function blank() { return { apps: [], folders: [], tasks: [], seq: 1 }; }

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (d && Array.isArray(d.apps) && Array.isArray(d.folders) && Array.isArray(d.tasks)) return d;
    } catch (e) {}
    return blank();
  }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
  function nextId(d) { return d.seq++; }
  function stamp() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'general'; }
  function ok(data) { return Object.assign({ ok: true }, data || {}); }
  function fail(error, status) { return { __error: error, __status: status || 422 }; }
  function byId(list, id) { return list.find(function (x) { return x.id === id; }); }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result)); };
      r.onerror = function () { reject(new Error('file read failed')); };
      r.readAsDataURL(file);
    });
  }

  function fields(body) {
    var out = {};
    if (!body) return Promise.resolve(out);
    if (typeof body === 'string') {
      new URLSearchParams(body).forEach(function (v, k) { out[k] = v; });
      return Promise.resolve(out);
    }
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      var jobs = [];
      body.forEach(function (v, k) {
        if (typeof v === 'string') { out[k] = v; }
        else jobs.push(readFile(v).then(function (data) { out[k] = data; }));
      });
      return Promise.all(jobs).then(function () { return out; });
    }
    return Promise.resolve(out);
  }

  function isDataUri(s) { return typeof s === 'string' && s.indexOf('data:') === 0; }

  // ---------- applications ----------
  function applications(method, p, f) {
    var d = load();
    if (method === 'POST') {
      var name = String(f.name || '').trim();
      if (!name) return fail('name_required');
      var a = { id: nextId(d), name: name, logo: isDataUri(f.logo) ? f.logo : null, created_at: stamp() };
      d.apps.push(a); save(d); return ok({ id: a.id, logo: a.logo });
    }
    if (method === 'PATCH') {
      var id = Number(p.get('id'));
      var a2 = byId(d.apps, id);
      if (!a2) return fail('not_found', 404);
      if (f.name !== undefined) {
        var n = String(f.name).trim();
        if (!n) return fail('name_required');
        a2.name = n;
      }
      if (isDataUri(f.logo)) a2.logo = f.logo;
      if (f.remove_logo === '1') a2.logo = null;
      save(d); return ok({ logo: a2.logo });
    }
    if (method === 'DELETE') {
      var id2 = Number(p.get('id'));
      d.apps = d.apps.filter(function (a) { return a.id !== id2; });
      var dead = d.folders.filter(function (x) { return x.application_id === id2; }).map(function (x) { return x.id; });
      d.folders = d.folders.filter(function (x) { return x.application_id !== id2; });
      d.tasks = d.tasks.filter(function (x) { return dead.indexOf(x.folder_id) === -1; });
      save(d); return ok();
    }
    return ok({ data: d.apps.slice().sort(function (a, b) { return b.id - a.id; }) });
  }

  // ---------- folders ----------
  function folders(method, p, f) {
    var d = load();
    if (method === 'POST') {
      var appId = Number(f.application_id), name = String(f.name || '').trim();
      if (!appId || !name) return fail('application_id + name required');
      var x = { id: nextId(d), application_id: appId, name: name, slug: slug(name), created_at: stamp() };
      d.folders.push(x); save(d); return ok({ id: x.id });
    }
    if (method === 'PATCH') {
      var id = Number(p.get('id')), name2 = String(f.name || '').trim();
      var x2 = byId(d.folders, id);
      if (!x2 || !name2) return fail('id + name required');
      x2.name = name2; x2.slug = slug(name2); save(d); return ok();
    }
    if (method === 'DELETE') {
      var id2 = Number(p.get('id'));
      d.folders = d.folders.filter(function (x) { return x.id !== id2; });
      d.tasks = d.tasks.filter(function (x) { return x.folder_id !== id2; });
      save(d); return ok();
    }
    var app = Number(p.get('application_id'));
    var rows = app > 0
      ? d.folders.filter(function (x) { return x.application_id === app; }).sort(function (a, b) { return a.id - b.id; })
      : d.folders.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 100);
    return ok({ data: rows });
  }

  // ---------- tasks ----------
  function tasks(method, p, f) {
    var d = load();
    if (method === 'POST') {
      var folderId = Number(f.folder_id), title = String(f.title || '').trim();
      var st = ['todo', 'done'].indexOf(f.status || 'todo') >= 0 ? (f.status || 'todo') : 'todo';
      var pr = ['low', 'medium', 'high'].indexOf(f.priority || 'medium') >= 0 ? (f.priority || 'medium') : 'medium';
      if (!folderId || !title) return fail('folder_id + title required');
      var t = {
        id: nextId(d), folder_id: folderId, title: title, description: String(f.description || '').trim(),
        status: st, priority: pr, created_at: stamp(), updated_at: stamp()
      };
      d.tasks.push(t); save(d); return ok({ id: t.id });
    }
    if (method === 'PATCH') {
      var id = Number(p.get('id') || f.id), t2 = byId(d.tasks, id);
      if (!t2) return fail('id required');
      if (f.title !== undefined) {
        var ti = String(f.title).trim();
        if (!ti) return fail('title required');
        t2.title = ti;
      }
      if (f.description !== undefined) t2.description = String(f.description).trim();
      if (f.status !== undefined) {
        if (['todo', 'done'].indexOf(f.status) === -1) return fail('invalid status');
        t2.status = f.status;
      }
      if (f.priority !== undefined) {
        if (['low', 'medium', 'high'].indexOf(f.priority) === -1) return fail('invalid priority');
        t2.priority = f.priority;
      }
      t2.updated_at = stamp(); save(d); return ok();
    }
    if (method === 'DELETE') {
      var id2 = Number(p.get('id'));
      d.tasks = d.tasks.filter(function (x) { return x.id !== id2; });
      save(d); return ok();
    }
    var folder = Number(p.get('folder_id'));
    if (!folder) return fail('folder_id required');
    return ok({ data: d.tasks.filter(function (x) { return x.folder_id === folder; }).sort(function (a, b) { return b.id - a.id; }) });
  }

  // ---------- backup ----------
  function exportPayload() {
    var d = load(), logos = {};
    var apps = d.apps.slice().sort(function (a, b) { return a.id - b.id; }).map(function (a) {
      var key = null;
      if (isDataUri(a.logo)) { key = 'logo-' + a.id; logos[key] = a.logo; }
      var fs = d.folders.filter(function (f) { return f.application_id === a.id; })
        .sort(function (x, y) { return x.id - y.id; }).map(function (f) {
          var ts = d.tasks.filter(function (t) { return t.folder_id === f.id; })
            .sort(function (x, y) { return x.id - y.id; }).map(function (t) {
              return {
                title: t.title, description: t.description || '', status: t.status, priority: t.priority,
                created_at: t.created_at, updated_at: t.updated_at
              };
            });
          return { name: f.name, slug: f.slug, created_at: f.created_at, tasks: ts };
        });
      return { name: a.name, logo: key, created_at: a.created_at, folders: fs };
    });
    return {
      app: 'timo', format: 1, exported_at: new Date().toISOString(),
      counts: { applications: d.apps.length, folders: d.folders.length, tasks: d.tasks.length },
      applications: apps, logos: logos
    };
  }

  function decodeDataUri(uri) {
    var m = /^data:[^,]*;base64,(.*)$/.exec(String(uri || ''));
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch (e) { return null; }
  }

  function importPayload(payload, mode) {
    if (!payload || !Array.isArray(payload.applications) || payload.app !== 'timo') return fail('invalid_backup');
    var d = mode === 'replace' ? blank() : load();
    var logos = payload.logos && typeof payload.logos === 'object' ? payload.logos : {};
    var counts = { applications: 0, folders: 0, tasks: 0 };

    payload.applications.forEach(function (a) {
      if (!a || typeof a.name !== 'string' || !a.name.trim()) return;
      var name = a.name.trim();
      var app = mode === 'merge' ? d.apps.find(function (x) { return x.name === name; }) : null;
      if (!app) {
        var logo = logos[a.logo] || null;
        app = { id: nextId(d), name: name, logo: isDataUri(logo) ? logo : null, created_at: a.created_at || stamp() };
        d.apps.push(app); counts.applications++;
      }
      (Array.isArray(a.folders) ? a.folders : []).forEach(function (fo) {
        if (!fo || typeof fo.name !== 'string' || !fo.name.trim()) return;
        var fname = fo.name.trim();
        var folder = mode === 'merge'
          ? d.folders.find(function (x) { return x.application_id === app.id && x.name === fname; })
          : null;
        if (!folder) {
          folder = {
            id: nextId(d), application_id: app.id, name: fname,
            slug: fo.slug || slug(fname), created_at: fo.created_at || stamp()
          };
          d.folders.push(folder); counts.folders++;
        }
        (Array.isArray(fo.tasks) ? fo.tasks : []).forEach(function (ta) {
          if (!ta || typeof ta.title !== 'string' || !ta.title.trim()) return;
          d.tasks.push({
            id: nextId(d), folder_id: folder.id, title: ta.title.trim(), description: String(ta.description || ''),
            status: ['todo', 'done'].indexOf(ta.status) >= 0 ? ta.status : 'todo',
            priority: ['low', 'medium', 'high'].indexOf(ta.priority) >= 0 ? ta.priority : 'medium',
            created_at: ta.created_at || stamp(), updated_at: ta.updated_at || stamp()
          });
          counts.tasks++;
        });
      });
    });
    save(d);
    return ok(counts);
  }

  function handle(url, opts) {
    var path = url.pathname.replace(/\/+$/, '');
    var name = path.split('/').pop();
    var p = url.searchParams;
    var method = String(opts.method || 'GET').toUpperCase();

    return fields(opts.body).then(function (f) {
      if (name === 'backup.php') {
        if (method === 'POST') {
          var data = decodeDataUri(f.file);
          if (!data) return fail('invalid_json');
          return importPayload(data, f.mode === 'replace' ? 'replace' : 'merge');
        }
        return { __blob: true, data: exportPayload() };
      }
      var override = String(p.get('_method') || f._method || method).toUpperCase();
      // PATCH calls send some fields in the query string (e.g. status changes).
      if (override === 'PATCH') {
        p.forEach(function (v, k) { if (f[k] === undefined) f[k] = v; });
      }
      if (name === 'applications.php') return applications(override, p, f);
      if (name === 'folders.php') return folders(override, p, f);
      if (name === 'tasks.php') return tasks(override, p, f);
      return fail('not_found', 404);
    });
  }

  window.fetch = function (url, opts) {
    var u;
    try { u = new URL(String(url), location.href); } catch (e) { return nativeFetch(url, opts); }
    if (u.pathname.indexOf('/api/') === -1) return nativeFetch(url, opts);
    return handle(u, opts || {}).then(function (res) {
      if (res && res.__error) {
        return new Response(JSON.stringify({ ok: false, error: res.__error }), {
          status: res.__status, headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
      var body = res && res.__blob ? res.data : res;
      return new Response(JSON.stringify(body), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }).catch(function (err) {
      return new Response(JSON.stringify({ ok: false, error: String(err && err.message || err) }), { status: 500 });
    });
  };

  window.TIMO_STORE_KEY = KEY;
})();
