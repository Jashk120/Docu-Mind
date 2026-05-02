# Repository Context Map

## Scope
This file maps the current repository at `/home/curator/TCS/Prototype`, including runtime app code and archived/generated source snapshots under `frontend/storage/*`.

## Repo Layout
- `backend/`: FastAPI service that talks to GitHub API and OpenRouter LLM.
- `frontend/`: Next.js app with GitHub auth, pipeline UI, project history, analytics.
- `frontend/storage/*`: persisted/generated snapshot files and sample code artifacts.
- `files/`: auxiliary directory (no executable functions discovered).

## Function Inventory (Runtime Backend)

### `backend/app/main.py`
- `_require_token(token)` at `backend/app/main.py:24`: rejects missing GitHub token with HTTP 401.
- `health()` at `backend/app/main.py:30`: health check endpoint (`{"status": "ok"}`).
- `root()` at `backend/app/main.py:35`: root endpoint sanity response.
- `create_or_update_readme(payload)` at `backend/app/main.py:40`: validates token and writes/updates `README.md` in target repo via `GitHubService`.
- `analyze_repo(payload)` at `backend/app/main.py:47`: validates token and returns filtered Git tree metadata.
- `docstring_pipeline(payload)` at `backend/app/main.py:54`: runs non-streaming documentation pipeline.
- `docstring_pipeline_stream(payload)` at `backend/app/main.py:62`: runs SSE streaming pipeline.
- `event_generator()` (nested) at `backend/app/main.py:67`: yields JSON events for streaming endpoint.

### `backend/app/services/github_service.py`
- `GitHubService.__init__(token)` at `backend/app/services/github_service.py:11`: stores token and GitHub headers.
- `GitHubService.is_binary_file(path)` at `backend/app/services/github_service.py:20`: extension-based binary file filter.
- `GitHubService.is_excluded_path(path)` at `backend/app/services/github_service.py:25`: excludes env files and `node_modules` paths.
- `GitHubService.create_or_update_readme(owner, repo, content)` at `backend/app/services/github_service.py:29`: upserts `README.md` via GitHub Contents API.
- `GitHubService.analyze_repo(owner, repo)` at `backend/app/services/github_service.py:56`: fetches default branch, tree SHA, full recursive tree; returns filtered tree.
- `GitHubService.fetch_file_content(owner, repo, path)` at `backend/app/services/github_service.py:93`: returns decoded file text from GitHub contents endpoint.
- `GitHubService.create_pr_with_files(owner, repo, files_to_commit, branch_name)` at `backend/app/services/github_service.py:108`: creates/uses branch, upserts files, opens PR to `main`.

### `backend/app/services/pipeline_service.py`
- `PipelineService.__init__(github_service)` at `backend/app/services/pipeline_service.py:15`: configures OpenRouter client and validates key.
- `_llm_completion(prompt)` at `backend/app/services/pipeline_service.py:26`: single LLM completion with timeout.
- `_llm_completion_with_retry(prompt, attempts)` at `backend/app/services/pipeline_service.py:36`: retry wrapper for LLM calls.
- `_fallback_readme(owner, repo, context_md)` at `backend/app/services/pipeline_service.py:64`: deterministic README fallback.
- `get_language_for_path(path)` at `backend/app/services/pipeline_service.py:89`: maps file extension to language.
- `build_docstring_prompt(language, file_content)` at `backend/app/services/pipeline_service.py:97`: builds strict docstring-generation prompt.
- `_extract_usage(response)` at `backend/app/services/pipeline_service.py:116`: normalizes token usage metadata.
- `_generic_name_confidence(source)` at `backend/app/services/pipeline_service.py:126`: flags generic function names as low confidence.
- `run(owner, repo, max_files)` at `backend/app/services/pipeline_service.py:136`: full non-streaming pipeline (tree fetch, per-file docstring generation, context/readme generation, optional PR creation).
- `stream(owner, repo, max_files)` at `backend/app/services/pipeline_service.py:337`: streaming version of pipeline that yields stage events and final result.

### Backend model/config helpers
- `Settings.allowed_origins` property at `backend/app/config.py:17`: computes unique CORS origins list.
- Pydantic request schemas (data models, not functions): `CreateReadmeRequest`, `AnalyzeRepoRequest`, `DocstringPipelineRequest` in `backend/app/schemas.py`.

## Function Inventory (Runtime Frontend)

### Auth/API route handlers
- `GET()` at `frontend/src/app/api/runs/route.ts:11`: returns current user pipeline runs with file entries.
- `POST(req)` at `frontend/src/app/api/runs/route.ts:32`: persists pipeline output to object storage + Prisma (`PipelineRun`, `Project`, file rows).
- `GET()` at `frontend/src/app/api/projects/route.ts:7`: lists projects for current user.
- `GET(_, ctx)` at `frontend/src/app/api/projects/[id]/route.ts:8`: returns one project if owned by current user.
- `DELETE(_, ctx)` at `frontend/src/app/api/projects/[id]/route.ts:22`: deletes object-storage prefix + project record.
- `GET(req, ctx)` at `frontend/src/app/api/projects/[id]/files/route.ts:9`: secure file fetch by relative path from stored project folder.
- NextAuth session callback `session({ session, user })` at `frontend/src/auth.ts:18`: attaches `user.id` and GitHub access token to session.

### Frontend storage/utils/db
- `putTextObject(key, content)` at `frontend/src/lib/storage.ts:28`: uploads UTF-8 text object to S3-compatible storage.
- `readTextObject(key)` at `frontend/src/lib/storage.ts:39`: reads object as text.
- `deletePrefix(prefix)` at `frontend/src/lib/storage.ts:54`: paginated delete of all keys under prefix.
- `cn(...inputs)` at `frontend/src/lib/utils.ts:4`: Tailwind/class merge helper.
- `prisma` singleton init at `frontend/src/lib/db.ts:7`: shared Prisma client across hot reload.

### UI components
- `DashboardShell(...)` at `frontend/src/components/dashboard-shell.tsx:10`: client-only wrapper for dashboard component.
- `DashboardClient(...)` at `frontend/src/components/dashboard-client.tsx:38`: legacy dashboard UI flow (repo list, pipeline trigger, progress states).
- `Providers({ children })` at `frontend/src/components/providers.tsx:5`: NextAuth provider wrapper.
- `isActive(pathname, href)` at `frontend/src/components/app-navbar.tsx:13`: route active-state matcher.
- `AppNavbar()` at `frontend/src/components/app-navbar.tsx:18`: top navigation + sign-out.

### UI primitives
- `Select(props)` at `frontend/src/components/ui/select.tsx:9`: radix wrapper.
- `SelectTrigger(...)` at `frontend/src/components/ui/select.tsx:13`: trigger renderer.
- `SelectValue(props)` at `frontend/src/components/ui/select.tsx:30`: selected value renderer.
- `SelectContent(...)` at `frontend/src/components/ui/select.tsx:34`: menu content container.
- `SelectItem(...)` at `frontend/src/components/ui/select.tsx:44`: menu item renderer.
- `Card(...)` at `frontend/src/components/ui/card.tsx:5`: panel primitive.
- `CardHeader(...)` at `frontend/src/components/ui/card.tsx:9`: card header primitive.
- `CardTitle(...)` at `frontend/src/components/ui/card.tsx:13`: card title primitive.
- `CardContent(...)` at `frontend/src/components/ui/card.tsx:17`: card body primitive.
- `Badge(...)` at `frontend/src/components/ui/badge.tsx:5`: badge primitive.
- `Separator(...)` at `frontend/src/components/ui/separator.tsx:8`: separator primitive.
- `Button` forwardRef renderer at `frontend/src/components/ui/button.tsx:30`: button primitive with style variants.

### App pages and page-local helpers
- `LoginPage()` at `frontend/src/app/page.tsx:5`: GitHub sign-in landing page.
- `RootLayout(...)` at `frontend/src/app/layout.tsx:18`: app shell + global providers/fonts.
- `DashboardPage()` at `frontend/src/app/dashboard/page.tsx:8`: auth gate + dashboard render.
- `parseContextSections(context)` at `frontend/src/app/dashboard/dashboard-client.tsx:48`: extracts table-like and security-related lines from generated context.
- `DashboardClient({ accessToken })` at `frontend/src/app/dashboard/dashboard-client.tsx:55`: primary streaming pipeline UI, save run, show diff/context/confidence flags.
- `statusClasses(status)` at `frontend/src/app/projects/page.tsx:9`: UI status to class mapping.
- `ProjectsPage()` at `frontend/src/app/projects/page.tsx:16`: list project cards.
- `ProjectDetailPage({ params })` at `frontend/src/app/projects/[id]/page.tsx:9`: auth/project lookup and client handoff.
- `ProjectDetailClient({ project })` at `frontend/src/app/projects/[id]/project-detail-client.tsx:38`: tabs for README/CONTEXT/diffs/confidence.
- `avg(nums)` at `frontend/src/app/analytics/page.tsx:8`: numeric mean helper.
- `AnalyticsPage()` at `frontend/src/app/analytics/page.tsx:13`: aggregate run analytics.

## Function Inventory (Archived/Generated Files in `frontend/storage/*`)
These are stored artifacts/snapshots rather than active runtime app code.

### `frontend/storage/Jashk120/test/2026-04-29T10-07-42-332Z/*`
- `fetchUser(userId)` at `.../api.js:8`: fetch mock user by id via Axios.
- `createUser(name, email)` at `.../api.js:20`: mock user creation call.
- `hash_password(password)` at `.../auth.py:2`: SHA-256 hash helper.
- `verify_password(password, hashed)` at `.../auth.py:15`: password/hash comparison.
- `add(a, b)` at `.../utils.py:2`: add numbers.
- `multiply(a, b)` at `.../utils.py:15`: multiply numbers.
- `divide(a, b)` at `.../utils.py:28`: divide with zero guard.

### `frontend/storage/Jashk120/test/2026-04-29T10-14-00-039Z/*`
- `fetchUser(userId)` at `.../api.js:8`: fetch mock user by id.
- `createUser(name, email)` at `.../api.js:20`: mock user creation.
- `hash_password(password)` at `.../auth.py:2`: hash helper (variant).
- `verify_password(password, hashed)` at `.../auth.py:18`: hash verify helper (variant).
- `add(a, b)` at `.../utils.py:2`: add.
- `multiply(a, b)` at `.../utils.py:15`: multiply.
- `divide(a, b)` at `.../utils.py:28`: divide.

### `frontend/storage/Jashk120/Journal/2026-04-29T06-06-03-819Z/*`
- `onSubmit(data)` at `.../src/app/(auth)/auth/page.tsx:53`: form submit for auth flow.
- `GET(req)` at `.../src/app/api/trades/get-trades/route.ts:15`: list trades endpoint.
- `PATCH(request)` at `.../src/app/api/trades/update/route.ts:18`: update trade endpoint.
- `GET(request)` at `.../src/app/api/trades/user-trades/route.ts:21`: paginated user trades endpoint.
- `GET(req, { params })` at `.../src/app/api/trades/one-trade/[tradeId]/route.ts:19`: single trade fetch endpoint.
- `DELETE(request)` at `.../src/app/api/trades/delete/route.ts:17`: delete trade endpoint.
- `getDateRange(filter)` at `.../src/app/api/trades/analytics/route.ts:15`: analytics date-range builder.
- `POST(req)` at `.../src/app/api/trades/analytics/route.ts:41`: trade analytics endpoint.
- `POST(request)` at `.../src/app/api/trades/create/route.ts:20`: create trade endpoint.
- `useCurrencyInfo(baseCurrency, quoteCurrency)` at `.../const/useCurrency.ts:14`: currency conversion hook/function.
- `handleClick()` at `.../src/app/(landingPage)/page.tsx:26`: CTA/action handler.
- `App()` at `.../src/app/(app)/dashboard/page.tsx:15`: dashboard page component.
- `fetchData()` (nested) at `.../src/app/(app)/dashboard/page.tsx:32`: dashboard data loader.
- `ForexCalculator()` at `.../src/app/(app)/calculator/page.tsx:21`: calculator component.

## Data Model / Schema Context
- Backend expects GitHub token + `owner/repo` payloads.
- Frontend persists pipeline runs/projects in Prisma models: `User`, `Account`, `Session`, `PipelineRun`, `PipelineRunFile`, `Project` in `frontend/prisma/schema.prisma`.
- `Project.storagePath` points to object-store location where `README.md`, `CONTEXT.md`, and documented files are saved.

## Current Issues / Errors Found

### Verified checks run
- `python3 -m compileall backend/app`: pass (no Python syntax errors).
- `npm run -s lint` in `frontend`: pass with warnings only.

### Actual warnings
- `frontend/src/app/layout.tsx:26`: Next.js lint warning `@next/next/no-page-custom-font` for Google font `<link>` in layout head.
- `frontend/src/app/layout.tsx:27`: same warning for Material Symbols font `<link>`.

### Potential risk items (not hard errors)
- `backend/README.md` lists OAuth endpoints (`/auth/github/*`) that are not present in `backend/app/main.py`; README appears outdated.
- `frontend/README.md` references `/documentation`, but active routes are `/dashboard`, `/projects`, `/analytics`.
- `frontend/src/lib/storage.ts` throws at module import time if storage env vars are absent, which can break route loading early.

## Notes
- Existing `CONTEXT.md` (uppercase) is already present at repo root; this file (`context.md`) is a fresh, explicit function map requested for this audit.
