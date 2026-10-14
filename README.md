# SiteBuilder — Vizual Sayt Yaratuvchi (No-Code Visual Website Builder)

Webflow / Framer / Wix darajasidagi, o'zbek tilidagi to'liq vizual veb-sayt yaratish platformasi.

## Talablar

- Node.js 18+
- npm 9+

## O'rnatish

```bash
npm ci
# yoki
npm install
```

## Ishga tushirish

```bash
npm run dev      # localhost:3000
npm run build    # production yig'ish -> dist/
npm run preview  # yig'ilgan natijani ko'rish
```

## Test

```bash
npm run lint     # ESLint (dist/ tekshirilmaydi)
npm test         # Vitest unit testlar
npm run test:e2e # Playwright E2E (tests/e2e mavjud bo'lganda)
npm audit        # xavfsizlik auditi
```

## Papka tuzilmasi

```text
src/
  main.jsx                 # Vite kirish nuqtasi (minimal App)
  schema/projectSchema.js  # JSON sxema, fabrika, validatsiya, migratsiya
  store/commandManager.js  # Undo/Redo (Command Pattern + batch)
  store/editorStore.js     # Zustand + Immer global editor holati
  storage.js               # localStorage + IndexedDB saqlash
  utils/id.js              # unikal ID generatori
tests/
  unit/                    # Vitest unit testlar
  setup.js                 # jest-dom sozlamasi
```

## Arxitektura (qisqacha)

- **Yagona haqiqat manbai:** versiyali JSON loyiha (`versiya`, `sozlamalar`, `sahifalar`, `aktivlar`).
- **Holat:** Zustand + Immer (`useEditorStore`), barcha o'zgarishlar `CommandManager` orqali.
- **Tarix:** har bir o'zgarish buyruq sifatida `undoStack`/`redoStack` da; yangi buyruq `redo` ni tozalaydi.
- **Saqlash:** loyiha `localStorage` da, aktivlar `IndexedDB` da.
- **Migratsiya:** `migrateProject()` eski/chala ma'lumotni joriy sxemaga to'g'rilaydi.

## Topilgan muammolar va tuzatishlar (2026-10-14)

| # | Fayl | Muammo | Jiddiylik | Holat |
|---|------|--------|-----------|-------|
| 1 | `index.html` → `src/main.jsx` | Entry fayl yo'q edi, build xato berardi | Kritik | Tuzatildi (minimal entry) |
| 2 | `tests/unit/schema.test.js` | Ishlatilmaydigan `createPage` importi, lint warning | Past | Tuzatildi |
| 3 | `.eslintignore` yo'q edi | Lint `dist/` ni tekshirib 98 ta xato berardi | O'rta | Tuzatildi |
| 4 | `.gitignore` to'liq emas edi | `*.log`, `.env.*`, `coverage/` yo'q edi | Past | Tuzatildi |

Qolgan eslatmalar:
- `npm audit`: vitest/tinypool da 3 ta zaiflik (1 moderate, 2 critical) — `npm audit fix --force` breaking change talab qiladi, shuning uchun qoldirildi.
- `tests/e2e/` papkasi yo'q — Playwright ishga tushirilmadi.
- `src/` da faqat baza qatlami bor (UI: generator, editor canvas, shablonlar, eksport hali qo'shilmagan).

