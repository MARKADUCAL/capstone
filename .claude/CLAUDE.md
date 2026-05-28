# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AutoWashHub is a car wash management system with an Angular 19 frontend and raw PHP/MySQL backend.

- `frontend/` contains the Angular app, SSR entrypoints, Vercel serverless fallback, static assets, and Karma specs.
- `backend/autowash-hub-api/` contains the PHP API, database SQL scripts, uploads, and API docs.
- Frontend API calls use `environment.apiUrl`, currently `/api` in both `environment.ts` and `environment.prod.ts`.
- Backend API routes are centralized in `backend/autowash-hub-api/api/routes.php`, which dispatches by HTTP method and substring matches on request URI into `modules/get.php`, `modules/post.php`, `modules/put.php`, and `modules/upload.php`.

## Common commands

Run frontend commands from `frontend/`.

```powershell
npm install
npm start
npm run start:clean
npm run build
npm run watch
npm test
npx ng test --include "src/app/path/to/file.spec.ts"
npx ng test --watch=false --browsers=ChromeHeadless
npm run build:ssr
npm run serve:ssr:autowash-hub
```

No lint script is defined in `frontend/package.json`.

Backend is plain PHP, not Laravel despite older README text mentioning Artisan. Serve API from `backend/autowash-hub-api/api/` with PHP/Apache/Nginx, and apply SQL files in `backend/autowash-hub-api/database/` manually as needed.

## Architecture notes

### Angular frontend

- Routing lives in `frontend/src/app/app.routes.ts` and maps public auth/landing routes plus role-based layout routes.
- Role layouts live under `frontend/src/app/layout/` for admin, customer, and employee shells.
- Main role features live under `frontend/src/app/components/admin/`, `components/customer/`, and `components/employee/`.
- Authentication screens live under `frontend/src/app/features/authentication/`.
- Shared API/client logic is split between `frontend/src/app/services/` and `frontend/src/app/core/services/`.
- Angular Material theme is configured in `angular.json`; app uses standalone configuration through `app.config.ts` rather than NgModule bootstrap.
- SSR is configured through `src/main.server.ts`, `src/server.ts`, `app.config.server.ts`, and `app.routes.server.ts`; Vercel handler is `frontend/api/[...path].js`.

### PHP backend

- `api/index.php` includes `routes.php`; most endpoint behavior starts there.
- `api/config/database.php` creates PDO connection using constants; treat current checked-in credentials as sensitive and avoid copying them into logs, docs, or new files.
- `api/config/env.php` loads `.env`, and JWT logic falls back to default values in some routes if env vars are absent.
- `api/modules/global.php` formats common payload responses.
- `api/modules/get.php`, `post.php`, and `put.php` contain business logic for customers, admins, employees, bookings, services/pricing, inventory, feedback, landing page content, reports, and password reset flows.
- Upload handling and serving live in `api/modules/upload.php`; uploaded files are under `backend/autowash-hub-api/uploads/`.
- API docs are in `backend/autowash-hub-api/docs/API_DOCUMENTATION.md`; dashboard-specific notes are in `frontend/src/app/components/admin/dashboard/README.md`.

## Testing notes

- Unit specs are colocated as `*.spec.ts` under `frontend/src/app/` and run with Karma/Jasmine.
- Use `npx ng test --include "src/app/.../*.spec.ts"` for targeted frontend tests.
- README mentions backend PHPUnit, but this repo does not show Laravel/PHPUnit setup; verify backend manually through API requests or add tooling before claiming backend tests pass.

## Repo cautions

- `frontend/node_modules/` and `frontend/dist/` are present in this checkout; avoid editing generated/vendor files unless explicitly requested.
- `frontend/src/app/core/services/auth.servide.ts` appears intentionally named in current imports; check references before renaming.
- Keep backend route substring ordering in mind when adding endpoints, because broader substring checks can catch requests before later routes.
