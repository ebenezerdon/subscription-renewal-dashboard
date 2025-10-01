# Subscription Renewal Dashboard

This dashboard was created with help from [Teda.dev](https://teda.dev), the simplest AI app builder for regular people. It is a responsive, accessible, and visually polished web app to track upcoming subscription renewals, highlight charges due soon, and compute totals.

Features
- Add, edit, and delete subscriptions with frequency and start date.
- View upcoming charges grouped by date, with "Today" and "Soon" highlights.
- Quick totals for the next 30 days and an estimated monthly projection.
- Projection window control (30, 90, 365 days) and frequency filtering.
- All data persisted to browser localStorage so your subscriptions survive reloads.
- Keyboard navigable and respects prefers-reduced-motion.

How to use
1. Open index.html in a modern browser.
2. Click "Add subscription" to add your subscriptions. Use the date picker to set the first billing date.
3. Use the projection controls to change the lookahead window.
4. Click a subscription to edit it or use the Delete action.

Files
- index.html - Application shell, loads Tailwind and jQuery and the modular JavaScript.
- styles/main.css - Custom styles layered on Tailwind for polish, accessibility, and micro-interactions.
- scripts/helpers.js - Utilities for storage, date math, formatting, and validation.
- scripts/ui.js - Main UI logic, rendering, event wiring, and the App namespace with App.init and App.render.
- scripts/main.js - Entry point that initializes the app.

Accessibility and UX notes
- Semantic HTML and ARIA attributes are used where appropriate.
- Focus outlines and larger hit targets improve keyboard and touch usability.
- Colors were chosen for adequate contrast and to provide clear visual hierarchy.
- The app respects the prefers-reduced-motion setting.

Feedback and extension ideas
- Add CSV import/export for bulk migrations.
- Add currency selection and exchange rate support.
- Add reminders or calendar integration.

