// Generic modal dialog (native <dialog>) used for every add/edit form.
// openModal({title, submitText, fields}) -> Promise<FormData | null>
function openModal(cfg) {
  var dlg = document.getElementById('timoDialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'timoDialog';
    dlg.className = 'modal';
    document.body.appendChild(dlg);
  }

  var fields = cfg.fields || [];
  var seq = 0;
  fields.forEach(function (f) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(f.name || '')) f.name = 'f' + (++seq);
  });
  var html = '<form method="dialog" class="modal-form">';
  html += '<header class="modal-head"><h3></h3><button type="button" class="modal-x" data-x>&times;</button></header>';
  html += '<div class="modal-body">';
  fields.forEach(function (f) {
    var id = 'f_' + f.name;
    var label = '<label class="modal-label" for="' + id + '"></label>';
    var control;
    if (f.type === 'textarea') {
      control = '<textarea id="' + id + '" name="' + f.name + '" rows="3"></textarea>';
    } else if (f.type === 'select') {
      control = '<select id="' + id + '" name="' + f.name + '"></select>';
    } else if (f.type === 'file') {
      control = '<input id="' + id + '" type="file" name="' + f.name + '" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml">';
    } else if (f.type === 'checkbox') {
      control = '<input id="' + id + '" type="checkbox" name="' + f.name + '">';
    } else {
      control = '<input id="' + id + '" type="' + (f.type || 'text') + '" name="' + f.name + '">';
    }
    if (f.required) control = control.replace(/^(<input|<textarea|<select)/, '$1 required');
    if (f.type === 'checkbox') html += '<div class="modal-field is-check" data-field="' + f.name + '">' + control + label + '</div>';
    else html += '<div class="modal-field" data-field="' + f.name + '">' + label + control;
    if (f.type === 'file') html += '<small class="modal-hint"></small>';
    html += '</div>';
  });
  html += '</div>';
  html += '<footer class="modal-foot">' +
    '<button type="button" class="btn ghost" data-x></button>' +
    '<button type="submit" class="btn"></button>' +
    '</footer></form>';
  dlg.innerHTML = html;
  var form = dlg.querySelector('form');

  dlg.querySelector('.modal-head h3').textContent = cfg.title || '';
  dlg.querySelector('.modal-foot [data-x]').textContent = t('cancel');
  dlg.querySelector('.modal-foot button[type=submit]').textContent = cfg.submitText || t('save');

  fields.forEach(function (f, i) {
    var wrap = dlg.querySelector('[data-field="' + f.name + '"]');
    wrap.querySelector('.modal-label').textContent = f.label || '';
    if (f.hint) wrap.querySelector('.modal-hint').textContent = f.hint;
    var el = form.elements[f.name];
    if (f.type === 'select') {
      (f.options || []).forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        el.appendChild(opt);
      });
    }
    if (f.type === 'checkbox') {
      el.checked = !!f.value;
    } else if (f.value !== undefined && el) {
      el.value = f.value;
      if (f.placeholder) el.placeholder = f.placeholder;
    }
    if (i === 0 && el && el.focus) setTimeout(function () { el.focus(); }, 30);
  });

  return new Promise(function (resolve) {
    function detach() { dlg.removeEventListener('close', onClose); }
    function onClose() { detach(); resolve(null); }
    function done(fd) {
      detach();
      resolve(fd);
      dlg.close();
    }

    dlg.addEventListener('close', onClose);
    dlg.querySelectorAll('[data-x]').forEach(function (b) {
      b.onclick = function () { dlg.close(); };
    });
    dlg.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData();
      fields.forEach(function (f) {
        var el = form.elements[f.name];
        if (!el) return;
        if (f.type === 'file') { if (el.files && el.files[0]) fd.append(f.name, el.files[0]); }
        else if (f.type === 'checkbox') fd.append(f.name, el.checked ? '1' : '0');
        else fd.append(f.name, el.value);
      });
      done(fd);
    });
    dlg.showModal();
  });
}

function confirmBox(message) {
  return new Promise(function (resolve) {
    var dlg = document.createElement('dialog');
    dlg.className = 'modal';
    dlg.innerHTML =
      '<div class="modal-form">' +
        '<header class="modal-head"><h3></h3></header>' +
        '<div class="modal-body"><p class="confirm-msg"></p></div>' +
        '<footer class="modal-foot">' +
          '<button type="button" class="btn ghost" data-no></button>' +
          '<button type="button" class="btn btn-danger" data-yes></button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(dlg);
    dlg.querySelector('h3').textContent = t('confirm_delete');
    dlg.querySelector('.confirm-msg').textContent = message || '';
    dlg.querySelector('[data-no]').textContent = t('cancel');
    dlg.querySelector('[data-yes]').textContent = t('delete');

    function finish(accepted) {
      resolve(accepted);
      dlg.close();
      dlg.remove();
    }
    dlg.addEventListener('close', function () { resolve(false); });
    dlg.querySelector('[data-no]').onclick = function () { finish(false); };
    dlg.querySelector('[data-yes]').onclick = function () { finish(true); };
    dlg.showModal();
    dlg.querySelector('[data-yes]').focus();
  });
}