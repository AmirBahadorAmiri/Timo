// i18n — all strings live in JS so the extension needs no server.
(function () {
  var fa = {
    app_name: 'تیمو', dashboard: 'داشبورد', applications: 'اپلیکیشن‌ها', folders: 'پوشه‌ها',
    tasks: 'تسک‌ها', tools: 'ابزارها', add: 'افزودن', new_application: 'اپلیکیشن جدید',
    new_folder: 'پوشه جدید', new_task: 'تسک جدید', sort: 'ترتیب‌بندی', sort_new: 'جدیدترین',
    sort_old: 'قدیمی‌ترین', sort_prio: 'بالاترین اولویت', sort_status: 'وضعیت', sort_alpha: 'الفبایی',
    app_name_ph: 'اسم اپلیکیشن...', folder_name_ph: 'اسم پوشه...', task_title_ph: 'عنوان تسک...',
    empty_apps: 'هنوز اپلیکیشنی نساختی.',
    empty_folders: 'یک اپلیکیشن رو انتخاب کن تا پوشه‌هاش دیده بشن.',
    empty_tasks: 'توی این پوشه هنوز تسکی نیست.', todo: 'انجام\u200cنشده', done: 'انجام\u200cشده', low: 'کم', medium: 'متوسط', high: 'زیاد', add_application: 'افزودن اپلیکیشن',
    name: 'اسم', logo: 'لوگو', choose_image: 'انتخاب تصویر', replace_logo: 'تغییر لوگو',
    remove_logo: 'حذف لوگو', description: 'توضیح', priority: 'اولویت', status: 'وضعیت',
    edit: 'ویرایش', delete: 'حذف', cancel: 'انصراف', save: 'ذخیره', confirm_delete: 'مطمئنی می\u200cخوای حذف بشه؟',
    rename_app: 'ویرایش اپلیکیشن', delete_app: 'حذف اپلیکیشن', rename_folder: 'تغییر نام پوشه',
    delete_folder: 'حذف پوشه', edit_task: 'ویرایش تسک', delete_task: 'حذف تسک',
    mark_todo: 'بذار انجام\u200cنشده', mark_done: 'بذار انجام\u200cشده',
    error: 'خطا', import_export: 'خروجی/ورودی', export_json: 'خروجی JSON', import_json: 'ورودی JSON',
    import_title: 'ورودی فایل JSON', import_file: 'فایل JSON',
    import_file_hint: 'فایلی که از Timo خروجی گرفته\u0129ای را انتخاب کن', import_mode: 'روش ورود',
    import_mode_merge: 'افزودن به داده\u200cهای فعلی',
    import_mode_replace: 'جایگزینی کامل (داده\u200cهای فعلی پاک می\u200cشود)', import: 'ورود',
    export_done: 'فایل JSON دانلود شد', import_done: 'ورود انجام شد',
    confirm_import_replace: 'همهٔ داده\u200cهای فعلی پاک می\u200cشود و با محتوای فایل جایگزین می\u200cگردد. مطمئنی؟',
    file_required: 'فایلی انتخاب نشده', file_too_big: 'حجم فایل بیش از حد مجاز است',
    file_upload_failed: 'آپلود فایل ناموفق بود', invalid_json: 'فایل JSON نامعتبر است',
    invalid_backup: 'این فایل یک بکاپ معتبر Timo نیست', export_failed: 'خروجی گرفتن ناموفق بود',
    calendar: 'تقویم فارسی', prev_month: 'ماه قبل', next_month: 'ماه بعد', today: 'امروز',
    holiday: 'تعطیل رسمی', religious: 'مناسبت مذهبی', national: 'مناسبت ملی',
    no_event: 'مناسبت خاصی ثبت نشده است.',
    gregorian: 'میلادی', hijri: 'قمری',
    month_1: 'فروردین', month_2: 'اردیبهشت', month_3: 'خرداد', month_4: 'تیر',
    month_5: 'مرداد', month_6: 'شهریور', month_7: 'مهر', month_8: 'آبان',
    month_9: 'آذر', month_10: 'دی', month_11: 'بهمن', month_12: 'اسفند',
    week_0: 'شنبه', week_1: 'یکشنبه', week_2: 'دوشنبه', week_3: 'سه\u200cشنبه',
    week_4: 'چهارشنبه', week_5: 'پنجشنبه', week_6: 'جمعه',
    week_s_0: 'شنبه', week_s_1: 'یک', week_s_2: 'دو', week_s_3: 'سه',
    week_s_4: 'چهار', week_s_5: 'پنج', week_s_6: 'جمعه'
  };

  var en = {
    app_name: 'Timo', dashboard: 'Dashboard', applications: 'Applications', folders: 'Folders',
    tasks: 'Tasks', tools: 'Tools', add: 'Add', new_application: 'New application',
    new_folder: 'New folder', new_task: 'New task', sort: 'Sort', sort_new: 'Newest first',
    sort_old: 'Oldest first', sort_prio: 'Highest priority', sort_status: 'Status', sort_alpha: 'Title A-Z',
    app_name_ph: 'Application name...', folder_name_ph: 'Folder name...', task_title_ph: 'Task title...',
    empty_apps: 'No applications yet.',
    empty_folders: 'Select an application to see its folders.',
    empty_tasks: 'No tasks in this folder yet.', todo: 'To do', done: 'Done', low: 'Low', medium: 'Medium', high: 'High', add_application: 'Add application',
    name: 'Name', logo: 'Logo', choose_image: 'Choose image', replace_logo: 'Replace logo',
    remove_logo: 'Remove logo', description: 'Description', priority: 'Priority', status: 'Status',
    edit: 'Edit', delete: 'Delete', cancel: 'Cancel', save: 'Save', confirm_delete: 'Delete this for good?',
    rename_app: 'Edit application', delete_app: 'Delete application', rename_folder: 'Rename folder',
    delete_folder: 'Delete folder', edit_task: 'Edit task', delete_task: 'Delete task',
    mark_todo: 'Mark as to do', mark_done: 'Mark as done',
    error: 'Error', import_export: 'Import / Export', export_json: 'Export JSON', import_json: 'Import JSON',
    import_title: 'Import a JSON file', import_file: 'JSON file',
    import_file_hint: 'Pick a file exported from Timo', import_mode: 'Import mode',
    import_mode_merge: 'Merge into the current data',
    import_mode_replace: 'Replace everything (current data is erased)', import: 'Import',
    export_done: 'JSON file downloaded', import_done: 'Import finished',
    confirm_import_replace: 'All current data will be erased and replaced with the file content. Are you sure?',
    file_required: 'No file selected', file_too_big: 'The file is too large',
    file_upload_failed: 'Uploading the file failed', invalid_json: 'Invalid JSON file',
    invalid_backup: 'This is not a valid Timo backup file', export_failed: 'Export failed',
    calendar: 'Persian calendar', prev_month: 'Previous month', next_month: 'Next month', today: 'Today',
    holiday: 'Public holiday', religious: 'Religious occasion', national: 'National occasion',
    no_event: 'No special occasion recorded.',
    gregorian: 'Gregorian', hijri: 'Lunar (AH)',
    month_1: 'Farvardin', month_2: 'Ordibehesht', month_3: 'Khordad', month_4: 'Tir',
    month_5: 'Mordad', month_6: 'Shahrivar', month_7: 'Mehr', month_8: 'Aban',
    month_9: 'Azar', month_10: 'Dey', month_11: 'Bahman', month_12: 'Esfand',
    week_0: 'Sat', week_1: 'Sun', week_2: 'Mon', week_3: 'Tue',
    week_4: 'Wed', week_5: 'Thu', week_6: 'Fri',
    week_s_0: 'Sat', week_s_1: 'Sun', week_s_2: 'Mon', week_s_3: 'Tue',
    week_s_4: 'Wed', week_s_5: 'Thu', week_s_6: 'Fri'
  };

  var saved = 'fa';
  try { if (localStorage.getItem('timo_lang') === 'en') saved = 'en'; } catch (e) {}

  window.TIMO_LANG = saved;
  window.TIMO_I18N = saved === 'fa' ? fa : en;

  function t(key) { return window.TIMO_I18N[key] || key; }
  window.t = t;

  function paintStatic() {
    document.documentElement.lang = saved;
    document.documentElement.dir = saved === 'fa' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-i18n-ph'));
    });
    var langBtn = document.getElementById('langBtn');
    if (langBtn) langBtn.textContent = saved === 'fa' ? 'EN' : 'فا';
    var dataBtn = document.querySelector('#dataBtn .lbl');
    if (dataBtn) dataBtn.textContent = t('import_export');
    var appAdd = document.getElementById('appAdd');
    if (appAdd) appAdd.title = t('add_application');
    var sortBtn = document.getElementById('taskSort');
    if (sortBtn) { sortBtn.title = t('sort'); sortBtn.setAttribute('aria-label', t('sort')); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintStatic);
  else paintStatic();

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('#langBtn');
    if (!btn) return;
    try { localStorage.setItem('timo_lang', saved === 'fa' ? 'en' : 'fa'); } catch (err) {}
    location.reload();
  });
})();
