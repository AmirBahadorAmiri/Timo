# Timo

> 🌍 [English version](./README.md)

داشبورد مدیریت تسک برای برنامه‌نویس‌ها: سلسله‌مراتب `Application → Folder → Task` با PHP و MySQL خالص، دوزبانهٔ فارسی/انگلیسی، به‌همراه تایمر پومودورو که تنظیماتش در دیتابیس ذخیره می‌شود.

[![نسخه](https://img.shields.io/badge/version-v1.0-6366f1)](https://github.com/AmirBahadorAmiri/Timo/tree/v1.0)
[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![دیتابیس](https://img.shields.io/badge/database-MySQL%20%2F%20MariaDB-003545?logo=mysql&logoColor=white)](https://dev.mysql.com/doc/)
[![JavaScript](https://img.shields.io/badge/JS-vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)

## 📸 اسکرین‌شات

![داشبورد تیمو](./screenshot/screenshot.png)

## ✨ امکانات

### 🗂 دسته‌بندی
- سلسله‌مراتب `Application → Folder → Task`؛ حذف هر والد، زیرمجموعه‌هایش را هم پاک می‌کند
- ریل دایره‌ای اپلیکیشن‌ها: لوگوی اختصاصی هر اپ، و اگر لوگو نبود حرف اول اسم با گرادیان رنگی
- نمایش شناور نام اپ هنگام hover

### ✅ تسک‌ها
- یک دیالوگ مشترک برای ساخت **و** ویرایش — عنوان، توضیح، اولویت، وضعیت
- وضعیت‌های `todo` / `doing` / `done` و اولویت‌های `low` / `medium` / `high`
- منوی مرتب‌سازی کنار شمارنده: جدیدترین، قدیمی‌ترین، اولویت، وضعیت، الفبایی (انتخاب کاربر ذخیره می‌شود)
- دایرهٔ رنگی جلوی هر برچسب وضعیت: قرمز = انجام‌نشده، کهربایی = در حال انجام، سبز = انجام‌شده
- کلیک روی ردیف، توضیح تسک را باز می‌کند

### 🎨 رابط کاربری
- دوزبانهٔ فارسی/انگلیسی با پشتیبانی کامل RTL
- تم روشن / تاریک؛ توکن‌های رنگ با `@property` ثبت شده‌اند تا تعویض تم انیمیت شود
- کانتکست‌منوی راست‌کلیک و دیالوگ‌های بومی `<dialog>`
- واکنش‌گرا: تک‌ستونه زیر ۱۱۰۰px عرض، چیدمان فشرده زیر ۸۴۰px ارتفاع

### ⏱ پومودورو
- یک تایمر واحد با چرخهٔ کار ⇄ استراحت
- دقیقهٔ کار و استراحت در MySQL (جدول `settings`) ذخیره و در `localStorage` کش می‌شود
- حلقهٔ گرادیانی که با تمام‌شدن زمان پر می‌شود
- صدا + نوتیفیکیشن در پایان؛ حالت بعدی آماده می‌شود ولی خودکار استارت نمی‌شود

### 🔌 API
- `applications.php`، `folders.php`، `tasks.php`، `settings.php`
- اورراید `_method` تا فرم‌ها بتوانند `PATCH` و `DELETE` را با `POST` بفرستند

## 🛠 تکنولوژی‌ها

| بخش | ابزار |
|---|---|
| بک‌اند | PHP 8.2 — PDO، بدون فریم‌ورک |
| دیتابیس | MySQL / MariaDB با `utf8mb4` |
| فرانت‌اند | جاوااسکریپت خالص، بدون build step |
| استایل | CSS دست‌نویس با توکن‌های رنگ `@property` |
| سرور | Apache (XAMPP) |

## 📁 ساختار پروژه

```text
Timo/
├── index.php             پوستهٔ داشبورد + راه‌اندازی زبان
├── config/
│   └── config.php        ثابت‌های دیتابیس، توابع PDO و JSON، آپلود لوگو
├── api/
│   ├── applications.php  CRUD (+ پاک‌کردن فایل لوگو هنگام حذف)
│   ├── folders.php       CRUD
│   ├── tasks.php         CRUD
│   └── settings.php      خواندن / ذخیرهٔ دقیقه‌های تایمر
├── assets/
│   ├── css/
│   │   ├── style.css     دیزاین‌سیستم، تم‌ها، چیدمان، مودال، منو
│   │   └── pomotroid.css کارت تایمر
│   └── js/
│       ├── app.js        اپ‌ها، پوشه‌ها، تسک‌ها، مرتب‌سازی
│       ├── modal.js      فرم عمومی `<dialog>` + جعبهٔ تأیید
│       ├── contextmenu.js منوی راست‌کلیک
│       ├── pomotroid.js  تایمر
│       ├── widgets.js    کارت ساعت و تاریخ
│       └── i18n.js       دسترسی به کلیدها با t(key)
├── lang/
│   ├── fa.php            ۶۳ کلید
│   └── en.php            ۶۳ کلید
├── database/
│   └── schema.sql        جدول‌ها + مهاجرت idempotent ستون logo
├── screenshot/
│   └── screenshot.png    پیش‌نمایش داشبورد که در همین README استفاده شده
└── uploads/              لوگوی اپ‌ها در زمان اجرا (فقط .htaccess کامیت شده)
```

## 🚀 اجرا و راه‌اندازی

**۱. کلون**

```bash
git clone https://github.com/AmirBahadorAmiri/Timo.git
```

**۲. انتقال به `htdocs` زامبپ**

```cmd
move Timo C:\xampp\htdocs\www\
```

**۳. روشن‌کردن Apache و MySQL** از کنترل‌پنل زامبپ.

**۴. ساخت و پرکردن دیتابیس** — خودِ `schema.sql` دیتابیس را می‌سازد، پس یک دستور کافی است:

```cmd
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\schema.sql
```

**۵. باز کردن** [http://localhost/Timo/index.php](http://localhost/Timo/index.php)

> اطلاعات اتصال در `config/config.php` است و به‌صورت پیش‌فرض همان `root` با پسورد خالی زامبپ است.

## 📋 پیش‌نیازها

- زامبپ با Apache، PHP 8 و MySQL/MariaDB
- اطلاعات پیش‌فرض دیتابیس زامبپ (`root` با پسورد خالی)
- مرورگر کرومیومی یا فایرفاکس (رابط کاربری از `<dialog>`، `@property` و `color-mix` استفاده می‌کند)

---

ساخته‌شده با ❤️ توسط امیر