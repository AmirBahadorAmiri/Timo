// Persian calendar — Borkowski solar conversion + Umm al-Qura lunar dates.
(function () {
  var mount = document.getElementById('calendar');
  if (!mount) return;

  // ---------- Solar (Jalali) conversion — Borkowski, exact for 1300–1500 SH ----------
  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060,
    2097, 2192, 2262, 2324, 2394, 2456, 3178];
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }

  function leapFromCycle(jump, n) {
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    var leap = mod(mod(n + 1, 33) - 1, 4);
    return leap === -1 ? 4 : leap;
  }
  function jalCal(jy) {
    var gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm = 0, jump = 0;
    for (var i = 1; i < BREAKS.length; i++) {
      jm = BREAKS[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    var n = jy - jp;
    leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ++;
    var leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    return { gy: gy, march: 20 + leapJ - leapG, leap: leapFromCycle(jump, n) };
  }
  function g2d(gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
      div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  }
  function d2g(jdn) {
    var j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    var i = div(mod(j, 1461), 4) * 5 + 308;
    var gm = mod(div(i, 153), 12) + 1;
    return { gy: div(j, 1461) - 100100 + div(8 - gm, 6), gm: gm, gd: div(mod(i, 153), 5) + 1 };
  }
  function j2d(jy, jm, jd) {
    var r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }
  function toJalali(gy, gm, gd) {
    var jdn = g2d(gy, gm, gd), jy = gy - 621, r = jalCal(jy);
    var k = jdn - g2d(r.gy, 3, r.march);
    if (k >= 0) {
      if (k <= 185) return { jy: jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
      k -= 186;
    } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    return { jy: jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
  }
  function monthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return jalCal(jy).leap === 0 ? 30 : 29;
  }

  // ---------- Lunar (Hijri) from the platform's ICU ----------
  var hijriFmt = null;
  function hijriOf(date) {
    try {
      if (!hijriFmt) {
        hijriFmt = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura-nu-latn', {
          year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC'
        });
      }
      var o = {};
      hijriFmt.formatToParts(date).forEach(function (p) {
        if (p.type !== 'literal' && o[p.type] === undefined) o[p.type] = parseInt(p.value, 10);
      });
      return o;
    } catch (e) { return null; }
  }

  // ---------- Occasions ----------
  function ev(title, type, reason) { return { t: title, type: type, r: reason }; }
  var HOLIDAY = 'holiday', RELIGIOUS = 'religious', NATIONAL = 'national';

  var SOLAR = {
    '1/1': [ev('عید نوروز', HOLIDAY, 'آغاز سال نو و جشن نوروز؛ نخستین روز از تعطیلات رسمی بهاری است.')],
    '1/2': [ev('دومین روز عید نوروز', HOLIDAY, 'دومین روز از تعطیلات رسمی نوروز است.')],
    '1/3': [ev('سومین روز عید نوروز', HOLIDAY, 'سومین روز از تعطیلات رسمی نوروز است.')],
    '1/4': [ev('چهارمین روز عید نوروز', HOLIDAY, 'چهارمین روز از تعطیلات رسمی نوروز است.')],
    '1/5': [ev('پنجمین روز عید نوروز (عید بزرگ)', HOLIDAY, 'پنجمین روز نوروز که در ایران «عید بزرگ» نامیده می‌شود و تعطیل رسمی است.')],
    '1/12': [ev('روز جمهوری اسلامی', HOLIDAY, 'سالگرد برپایی جمهوری اسلامی در ۱۲ فروردین ۱۳۵۸ و تعطیل رسمی است.')],
    '1/13': [ev('سیزده\u200cبدر، روز طبیعت', NATIONAL, 'سیزده\u200cبدر یک سنت ملی است؛ ادارات معمولاً تعطیل هستند ولی تعطیلی رسمی تقویمی محسوب نمی‌شود.')],
    '1/20': [ev('روز فناوری اطلاعات', NATIONAL, 'زادروز امام موسی صدر و نام\u200cگذاری روز فناوری اطلاعات در ایران.')],
    '2/1': [ev('روز بزرگداشت سعدی', NATIONAL, 'یادبود شاعر نامی ایران، سعدی شیرازی.')],
    '2/12': [ev('روز معلم', NATIONAL, 'سالگرد شهادت استاد مرتضی مطهری و گرامیداشت معلمان در سراسر کشور.')],
    '2/31': [ev('روز بزرگداشت فردوسی', NATIONAL, 'یادبود حکیم ابوالقاسم فردوسی، سرایندهٔ شاهنامه.')],
    '3/14': [ev('رحلت امام خمینی (ره)', HOLIDAY, 'سالگرد درگذشت بنیان\u200cگذار جمهوری اسلامی و تعطیل رسمی کشور است.')],
    '3/15': [ev('قیام ۱۵ خرداد', NATIONAL, 'سالگرد قیام مردم در ۱۵ خرداد ۱۳۴۲ علیه حکومت وقت.')],
    '4/7': [ev('شهدای هفتم تیر', NATIONAL, 'سالگرد شهادت شهید بهشتی و ۷۲ تن از یاران او در انفجار دفتر حزب جمهوری اسلامی.')],
    '5/28': [ev('کودتای ۲۸ مرداد', NATIONAL, 'سالگرد کودتای ۲۸ مرداد ۱۳۳۲ و سرنگونی دولت مصدق.')],
    '8/13': [ev('تسخیر لانهٔ جاسوسی', NATIONAL, 'سالگرد تسخیر سفارت آمریکا در تهران و روز ملی مبارزه با استکبار.')],
    '9/16': [ev('روز دانشجو', NATIONAL, 'سالگرد شهادت سه دانشجو در ۱۶ آذر ۱۳۳۲ و گرامیداشت مقام دانشجو.')],
    '11/12': [ev('سالگرد پیروزی انقلاب', NATIONAL, 'دوازدهم بهمن، سالگرد بازگشت امام خمینی (ره) به ایران و آغاز پیروزی انقلاب.')],
    '11/22': [ev('پیروزی انقلاب اسلامی', HOLIDAY, 'سالگرد پیروزی انقلاب اسلامی در ۲۲ بهمن ۱۳۵۷ و تعطیل رسمی است.')],
    '12/29': [ev('روز ملی شدن صنعت نفت', NATIONAL, 'سالگرد تصویب قانون ملی شدن صنعت نفت ایران در ۲۹ اسفند ۱۳۲۹.')]
  };

  var HIJRI = {
    '1/1': [ev('آغاز سال قمری', RELIGIOUS, 'نخستین روز ماه محرم و آغاز سال قمری هجری است.')],
    '1/9': [ev('تاسوعای حسینی', RELIGIOUS, 'نهم محرم، روز تاسوعا و از روزهای عزاداری حضرت اباعبدالله الحسین (ع).')],
    '1/10': [ev('عاشورای حسینی', HOLIDAY, 'دهم محرم، سالگرد شهادت امام حسین (ع) و تعطیل رسمی است.')],
    '2/28': [ev('رحلت پیامبر اکرم (ص)', RELIGIOUS, 'سالگرد رحلت حضرت محمد (ص) و شهادت امام حسن مجتبی (ع).')],
    '2/30': [ev('شهادت امام رضا (ع)', RELIGIOUS, 'سالگرد شهادت امام هشتم، حضرت رضا (ع)، به روایت مشهور.')],
    '3/12': [ev('میلاد پیامبر اکرم (ص)', RELIGIOUS, 'سالگرد ولادت حضرت محمد (ص) و آغاز هفتهٔ وحدت.')],
    '5/3': [ev('شهادت حضرت فاطمه (س)', RELIGIOUS, 'سالگرد شهادت حضرت فاطمه زهرا (س) به روایت ۷۵ روز.')],
    '5/20': [ev('ولادت حضرت فاطمه (س)', RELIGIOUS, 'سالگرد ولادت حضرت فاطمه زهرا (س) و روز زن.')],
    '7/13': [ev('ولادت امام علی (ع)', RELIGIOUS, 'سالگرد ولادت امام نخست شیعیان، حضرت علی (ع).')],
    '7/27': [ev('مبعث رسول الله (ص)', RELIGIOUS, 'سالگرد برانگیخته شدن پیامبر اسلام (ص) به رسالت.')],
    '8/3': [ev('ولادت امام حسین (ع)', RELIGIOUS, 'سالگرد ولادت حضرت اباعبدالله الحسین (ع).')],
    '8/15': [ev('ولادت امام مهدی (عج)', RELIGIOUS, 'سالگرد ولادت حضرت مهدی (عج) و روز امامت.')],
    '8/25': [ev('شهادت امام صادق (ع)', RELIGIOUS, 'سالگرد شهادت امام جعفر صادق (ع)، بنیان\u200cگذار مکتب فقهی شیعه.')],
    '9/1': [ev('آغاز ماه مبارک رمضان', RELIGIOUS, 'نخستین روز ماه رمضان، ماه روزه و عبادت.')],
    '9/19': [ev('شب قدر', RELIGIOUS, 'از شب\u200cهای مبارک قدر؛ شب نزول قرآن.')],
    '9/21': [ev('شب قدر', RELIGIOUS, 'از شب\u200cهای مبارک قدر؛ شب نزول قرآن.')],
    '9/23': [ev('شب قدر و شهادت امام علی (ع)', RELIGIOUS, 'آخرین شب قدر و سالگرد شهادت حضرت علی (ع).')],
    '10/1': [ev('عید سعید فطر', HOLIDAY, 'پایان ماه رمضان و جشن عید فطر؛ تعطیل رسمی است.')],
    '11/11': [ev('ولادت امام رضا (ع)', RELIGIOUS, 'سالگرد ولادت امام هشتم، حضرت رضا (ع).')],
    '11/23': [ev('شهادت امام رضا (ع)', RELIGIOUS, 'سالگرد شهادت امام رضا (ع) به روایت ۲۳ ذی\u200cالقعده.')],
    '12/10': [ev('عید سعید قربان', HOLIDAY, 'دهم ذی\u200cالحجه و جشن قربان؛ تعطیل رسمی است.')],
    '12/18': [ev('عید سعید غدیر خم', HOLIDAY, 'سالگرد اعلام ولایت امام علی (ع) در غدیر خم؛ تعطیل رسمی است.')]
  };

  // ---------- Helpers ----------
  var isFa = window.TIMO_LANG === 'fa';
  var faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function num(n) {
    var s = String(n);
    return isFa ? s.replace(/\d/g, function (d) { return faDigits[+d]; }) : s;
  }
  function dayOfWeek(g) { return new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay(); } // 0=Sun .. 6=Sat
  function weekIndex(g) { return (dayOfWeek(g) + 1) % 7; } // Saturday first
  function monthName(m) { return t('month_' + m); }
  function weekName(i) { return t('week_' + i); }
  function shortWeekName(i) { return t('week_s_' + i); }

  function eventsOf(jy, jm, jd) {
    var list = (SOLAR[jm + '/' + jd] || []).slice();
    var g = toGregorian(jy, jm, jd);
    var h = hijriOf(new Date(Date.UTC(g.gy, g.gm - 1, g.gd)));
    if (h) {
      var lunar = HIJRI[h.month + '/' + h.day];
      if (lunar) {
        lunar.forEach(function (e) {
          list.push(ev(e.t, e.type, e.r + ' (' + num(h.day) + ' ' + (isFa ? HijriFa[h.month - 1] : HijriEn[h.month - 1]) + ' ' + num(h.year) + ')'));
        });
      }
    }
    if (weekIndex(g) === 6) list.push(ev(isFa ? 'جمعه (تعطیل هفتگی)' : 'Friday (weekly closure)', HOLIDAY,
      isFa ? 'روز جمعه، تعطیل رسمی هفتگی در ایران است.' : 'Friday is the official weekly day off in Iran.'));
    return list;
  }

  var HijriFa = ['محرم', 'صفر', 'ربیع\u200cالاول', 'ربیع\u200cالثانی', 'جمادی\u200cالاول', 'جمادی\u200cالثانی',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی\u200cالقعده', 'ذی\u200cالحجه'];
  var HijriEn = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani',
    'Rajab', 'Shaaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'];

  // ---------- State ----------
  var todayJ = toJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
  var view = { y: todayJ.jy, m: todayJ.jm };
  var selected = { y: todayJ.jy, m: todayJ.jm, d: todayJ.jd };

  var html =
    '<div class="cal card">' +
      '<div class="cal-head">' +
        '<h3><span class="cal-dot"></span><span class="cal-label"></span></h3>' +
        '<div class="cal-nav">' +
          '<button type="button" class="cal-nav-btn" id="calPrev" aria-label="' + t('prev_month') + '">‹</button>' +
          '<button type="button" class="cal-today" id="calToday"></button>' +
          '<button type="button" class="cal-nav-btn" id="calNext" aria-label="' + t('next_month') + '">›</button>' +
        '</div>' +
      '</div>' +
      '<div class="cal-title" id="calTitle"></div>' +
      '<div class="cal-week" id="calWeek"></div>' +
      '<div class="cal-grid" id="calGrid"></div>' +
      '<div class="cal-detail" id="calDetail"></div>' +
      '<div class="cal-legend"><span><i class="lg lg-h"></i>' + t('holiday') + '</span>' +
        '<span><i class="lg lg-r"></i>' + t('religious') + '</span>' +
        '<span><i class="lg lg-n"></i>' + t('national') + '</span></div>' +
    '</div>';
  mount.innerHTML = html;
  mount.querySelector('.cal-label').textContent = t('calendar');
  document.getElementById('calToday').textContent = t('today');

  var titleEl = document.getElementById('calTitle');
  var weekEl = document.getElementById('calWeek');
  var gridEl = document.getElementById('calGrid');
  var detailEl = document.getElementById('calDetail');

  function typeLabel(type) {
    return type === HOLIDAY ? t('holiday') : type === RELIGIOUS ? t('religious') : t('national');
  }

  function renderWeek() {
    var out = '';
    for (var i = 0; i < 7; i++) {
      out += '<span class="cal-week-cell' + (i === 6 ? ' fri' : '') + '">' + shortWeekName(i) + '</span>';
    }
    weekEl.innerHTML = out;
  }

  function renderGrid() {
    var lead = weekIndex(toGregorian(view.y, view.m, 1));
    var len = monthLength(view.y, view.m);
    var prevY = view.m === 1 ? view.y - 1 : view.y;
    var prevM = view.m === 1 ? 12 : view.m - 1;
    var nextY = view.m === 12 ? view.y + 1 : view.y;
    var nextM = view.m === 12 ? 1 : view.m + 1;
    var prevLen = monthLength(prevY, prevM);
    var out = '';

    titleEl.textContent = monthName(view.m) + ' ' + num(view.y);

    for (var i = 0; i < 42; i++) {
      var jy = view.y, jm = view.m, jd = i - lead + 1, other = false;
      if (jd < 1) { jy = prevY; jm = prevM; jd = prevLen + jd; other = true; }
      else if (jd > len) { jy = nextY; jm = nextM; jd = jd - len; other = true; }

      var g = toGregorian(jy, jm, jd);
      var dow = dayOfWeek(g);
      var events = eventsOf(jy, jm, jd);
      var hasHoliday = events.some(function (e) { return e.type === HOLIDAY; });
      var hasReligious = events.some(function (e) { return e.type === RELIGIOUS; });
      var hasNational = events.some(function (e) { return e.type === NATIONAL; });
      var isToday = jy === todayJ.jy && jm === todayJ.jm && jd === todayJ.jd;
      var isSelected = jy === selected.y && jm === selected.m && jd === selected.d;
      var cls = 'cal-cell' + (other ? ' other' : '') + (dow === 5 ? ' fri' : '') +
        (hasHoliday ? ' is-holiday' : '') + (isToday ? ' is-today' : '') + (isSelected ? ' is-selected' : '');
      var dots = '';
      if (hasHoliday) dots += '<i class="cdot cdot-h"></i>';
      if (hasReligious) dots += '<i class="cdot cdot-r"></i>';
      if (hasNational) dots += '<i class="cdot cdot-n"></i>';
      out += '<button type="button" class="' + cls + '" data-y="' + jy + '" data-m="' + jm +
        '" data-d="' + jd + '" data-other="' + (other ? 1 : 0) + '">' +
        '<span class="cnum">' + num(jd) + '</span><span class="cdots">' + dots + '</span></button>';
    }
    gridEl.innerHTML = out;
  }

  function renderDetail() {
    var g = toGregorian(selected.y, selected.m, selected.d);
    var date = new Date(Date.UTC(g.gy, g.gm - 1, g.gd));
    var h = hijriOf(date);
    var weekday = weekName(weekIndex(g));
    var events = eventsOf(selected.y, selected.m, selected.d);
    var gMonthsFa = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت',
      'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
    var gMonthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December'];
    var gregorianText = g.gd + ' ' + (isFa ? gMonthsFa[g.gm - 1] : gMonthsEn[g.gm - 1]) + ' ' + g.gy;

    var out = '<div class="cd-head">' +
      '<div class="cd-big">' + num(selected.d) + ' ' + monthName(selected.m) + ' ' + num(selected.y) + '</div>' +
      '<div class="cd-week">' + weekday + '</div></div>' +
      '<div class="cd-dates">' +
        '<span>' + t('gregorian') + ': ' + num(gregorianText) + '</span>' +
        '<span>' + t('hijri') + ': ' + (h ? num(h.day) + ' ' + (isFa ? HijriFa[h.month - 1] : HijriEn[h.month - 1]) + ' ' + num(h.year) : '—') + '</span>' +
      '</div>';

    if (events.length) {
      out += '<ul class="cd-events">';
      events.forEach(function (e) {
        out += '<li><span class="cd-chip ' + e.type + '">' + typeLabel(e.type) + '</span>' +
          '<span class="cd-event-title">' + e.t + '</span></li>';
      });
      out += '</ul>';
    } else {
      out += '<div class="cd-none">' + t('no_event') + '</div>';
    }
    detailEl.innerHTML = out;
  }

  function render() { renderWeek(); renderGrid(); renderDetail(); }

  // ---------- Events ----------
  document.getElementById('calPrev').onclick = function () {
    view.m--; if (view.m < 1) { view.m = 12; view.y--; }
    renderGrid();
  };
  document.getElementById('calNext').onclick = function () {
    view.m++; if (view.m > 12) { view.m = 1; view.y++; }
    renderGrid();
  };
  document.getElementById('calToday').onclick = function () {
    var now = new Date();
    var j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    view = { y: j.jy, m: j.jm };
    selected = { y: j.jy, m: j.jm, d: j.jd };
    render();
  };
  gridEl.addEventListener('click', function (e) {
    var cell = e.target.closest('.cal-cell');
    if (!cell) return;
    selected = { y: +cell.dataset.y, m: +cell.dataset.m, d: +cell.dataset.d };
    if (cell.dataset.other === '1') { view = { y: selected.y, m: selected.m }; renderGrid(); }
    else renderGrid();
    renderDetail();
  });

  render();
})();
