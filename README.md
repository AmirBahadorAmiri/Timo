<p align="center">
  📄 Read in Persian: <a href="README.fa.md"><b>فارسی</b></a>
</p>

<p align="center">
  <img src="icons/icon400.png" width="400" title="Timo Logo">
</p>

# Timo (تیمو) ⏱
### A Chrome extension for developer tasks and the Persian calendar

**Timo** is a self-contained Chrome extension that replaces the Chrome new tab page with an `Application → Folder → Task` dashboard and a full Persian calendar. Everything runs locally in your browser — no PHP, no database server, no internet connection needed.

---

## 🆕 What's New in v2.0 — Chrome extension

This release moves Timo off XAMPP and into Chrome, and replaces the Pomodoro timer with a calendar:

*   **New tab page:** Manifest V3 `chrome_url_overrides` opens Timo whenever you open a new tab — no build step and no server; all data lives in `localStorage`.
*   **Persian calendar:** compact Solar Hijri month grid with holidays and religious occasions; the timer and its settings are gone.
*   **Clock simplified:** the heading, animated dot and date line are gone — the card shows time only, so the calendar becomes the single date view.
*   **Two task states:** `doing` was removed; the `✓` button now reliably toggles done and a done title is struck through.
*   **Layout & icon:** the tools column is narrower, folders and tasks share the freed width, and the toolbar icon is registered through `action.default_icon`.

---

## 🌟 Key Features

### 🗂 Task management
*   `Application → Folder → Task` hierarchy; deleting a parent cascades to its children.
*   Circular application rail with an optional logo and a gradient first-letter fallback.
*   One shared dialog for creating and editing tasks: title, description, priority and status.

### ✅ Task workflow
*   Statuses `todo` / `done` (not done / done), priorities `low` / `medium` / `high`.
*   Sort menu with newest, oldest, priority, status and alphabetical order; the choice is remembered.
*   Right-click or the `⋯` button opens edit, status and delete actions; `✓` toggles done.
*   **Done tasks:** the title gets a strike-through, so finished work is easy to scan.

### 📅 Persian calendar
*   Solar Hijri month view with Persian numerals, Saturday-first weeks and month navigation.
*   **Details on click:** pick any day to see its full Solar, Gregorian and Lunar dates and the occasions listed underneath the grid.
*   **Compact layout:** short weekday labels and small day cells keep the card at 290px, so the details stay visible without scrolling.
*   Official holidays (Nowruz, Republic Day, Imam Khomeini's passing, Victory of the Revolution, Eid al-Fitr, Eid al-Adha, Eid al-Ghadir, Ashura, Fridays) and national/religious occasions are marked with coloured dots.

### 🎨 Interface
*   Mountain wallpaper with frosted, translucent panels and glass controls.
*   Bilingual FA/EN with full RTL support and bundled Vazirmatn font.
*   Light / dark theme with animated colour tokens.
*   Full browser page as the new tab, with no popup size limit.

### 💾 Data & backup
*   JSON export and import that stays compatible with Timo v1 backups, with **merge** and **replace** modes.
*   Logos are stored as data URLs inside the same local workspace, so backups keep them too.

---

## 🛠 Technologies Used

Timo is built with plain web technologies and needs no toolchain:

*   **Language:** Vanilla JavaScript, no build step.
*   **Architecture:** Chrome Extension Manifest V3 with a new-tab override and a local API adapter.
*   **Storage:** `localStorage` (`timo.data.v1`) for applications, folders, tasks and logos.
*   **Date math:** Borkowski Solar Hijri conversion plus `Intl` Islamic (Umm al-Qura) for Lunar dates.
*   **UI:** HTML, native `<dialog>` modals, custom right-click menu, CSS custom properties.
*   **Design:** Hand-written CSS with `@property` colour tokens and a bundled Vazirmatn font.

---

## 🚀 Installation & Run Guide

1. Clone the repository:
```bash
git clone https://github.com/AmirBahadorAmiri/Timo.git
```
2. Open **chrome://extensions** in Chrome.
3. Turn on **Developer mode** using the switch in the top-right corner.
4. Click **Load unpacked** and select the `Timo` folder (the one that contains `manifest.json`).
5. Open a new tab (`Ctrl+T` / `⌘T`) — Timo loads automatically as the page.

No XAMPP, PHP, MySQL or `npm install` step is required.

---

## 🧭 How to Use

1. Click **+** in the application rail to create an application; you can attach a logo in the same dialog.
2. Select the application, type a folder name and press **Add**, then click **+ New task** for its tasks.
3. Use `⋯`, right-click or `✓` on a row to edit, change status or delete; `⇅` changes the sort order.
4. In the calendar, use `‹` / `›` to move between months and **Today** to jump back; click a day to read its dates and occasions below the grid.
5. Use **💾** in the header to export a JSON backup or import one back, choosing merge or replace.
6. `🌙` switches theme and `FA/EN` switches language; every new tab opens this same dashboard.

---

## 👨‍💻 Developer

Developed by **Amir Bahador Amiri**

> [!TIP]
> A day cell with a red dot is an official holiday — click any day to see its Solar, Gregorian and Lunar dates and its occasions underneath the calendar.
