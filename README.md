# Daybook

A responsive task manager built with Next.js App Router and React.

## Run locally

Requires Node.js 20.19+, 22.13+, or 24+ and npm (Node 24 LTS recommended).

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production build:

```sh
npm run build
npm start
```

## Deploy to GitHub Pages

Pushing to `main` builds a static export and publishes it via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). One-time setup:
in the repository, go to **Settings → Pages** and set **Source** to
**GitHub Actions**.

The site is served from https://mohitmalayanandy.github.io/ToDoList, so
`next.config.js` applies `basePath: "/ToDoList"` when `GITHUB_ACTIONS` is set.
Local `npm run dev` stays at the root. If the repository is renamed, update
`repo` in that file.

Because Pages only serves files, there is no server: `/` renders Today in place
rather than redirecting, and only the three seeded projects are prerendered.
Projects created in the browser get random ids, so their URLs fall through to
`404.html` — which boots the same app and resolves the id from the URL, so the
project still loads (the HTTP status is 404). `public/.nojekyll` keeps Pages
from stripping the `_next` asset directory.

## Features

- Add tasks with Enter or the Add task button.
- Edit titles, priorities, and optional due dates.
- Mark tasks complete and view progress.
- Search and filter all, active, or completed tasks.
- Sort by newest, priority, or due date (undated tasks appear last).
- Delete tasks or clear completed tasks, with Undo for the latest deletion.
- Persist tasks using browser local storage, with visible storage error handling.
- Responsive styling, keyboard controls, and reduced-motion support.

## Storage and migration

The app retains the original `daybook.tasks.v1` storage key and data format. Saved tasks load after React hydration; the initial empty state is never automatically saved. Existing tasks carry over when the new app is served from the **same browser origin**, including protocol and port. If the old app was served at http://localhost:8080, stop the old server and run `npm run dev -- --port 8080` to access that origin's saved tasks. Data saved from a directly opened `file://` page does not automatically transfer to localhost.

Tasks remain in this browser. There is no account, backend, or cross-device synchronization. Clearing site data removes saved tasks. Multiple tabs do not synchronize; the latest save wins. Malformed storage is reported, and the next change replaces it. Undo lasts until dismissed or replaced by another notification, and is not persisted across reloads.

## Project structure

- `app/layout.js`: root layout and metadata
- `app/page.js`: home route
- `app/globals.css`: responsive visual design
- `components/daybook.jsx`: interactive React task manager
- `lib/tasks.js`: storage validation, dates, filtering, and sorting
- `tests/daybook.test.jsx`: React interaction and data tests

## Checks

```sh
npm test
npm run build
npm run format
```

Tests run with Vitest, jsdom, and React Testing Library. They cover existing-data migration, edits, persistence, completion, filters, search, safe text rendering, deletion/undo, bulk clearing, invalid data, and storage failures. They do not verify browser layout.

The migration uses the [Next.js App Router setup](https://nextjs.org/docs/app/getting-started/installation).
