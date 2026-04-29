# CONTEXT.md

## Repository: Jashk120/Journal

### Architecture Overview

This is a **Next.js** application (App Router) for a Forex Trading Journal. It uses **Prisma** as the ORM with a SQL database, **Axios** for API calls, **React Hook Form** and **Zod** for form validation, and **shadcn/ui** components for the UI. The app is structured into three main layout groups: landing page, authentication, and app (authenticated). It includes trading analytics, trade CRUD operations, a forex calculator, and user authentication with OTP verification.

### Modules / Directory Structure

- **`const/`**  
  - `pairs.ts` – Exports `currencyPairs` (list of forex pairs, commodities, indices, crypto) and `options` (time range filters).
  - `useCurrency.ts` – React hook to fetch exchange rates from Open Exchange Rates API.

- **`emails/`**  
  - `VerificationEmail.tsx` – Email template using `@react-email/components` for sending OTP verification codes.

- **`src/app/(landingPage)/`** – Public landing page layout and home page.
- **`src/app/(auth)/`** – Authentication pages (sign-in form) with a separate layout.
- **`src/app/(app)/`** – Authenticated app pages: dashboard, home, calculator, trades (implied). Uses a common layout with sidebar.
- **`src/app/api/trades/`** – Backend API routes for trades: analytics, create, delete, get-trades, one-trade, update, user-trades.
- **`src/components/`** – Reusable UI components (shadcn based) and app-specific components (navbar, sidebar, calculator cards, analytics dashboard).
- **`src/helper/`** – `getDataFromTokens` for extracting user ID from JWT token.

### Setup Assumptions

- Node.js and npm/yarn installed.
- Next.js 13+ with App Router.
- Prisma with a database (likely PostgreSQL or SQLite). Run `npx prisma generate` and `npx prisma db push` to apply schema.
- Environment variables: `DATABASE_URL`, `JWT_SECRET` (or similar for token generation/validation), and API keys for email service (e.g., Resend) and Open Exchange Rates.
- Authentication via JWT tokens stored in cookies or local storage (implementation not fully shown but inferred from `getDataFromToken`).

### Key Flows

1. **User Authentication**  
   - Sign-in via `/auth` page using email/password.  
   - POST to `/api/users/login` (not documented but implied).  
   - On success, redirect to app dashboard.  
   - OTP verification email sent using `VerificationEmail` component.

2. **Trade Management**  
   - **Create**: POST `/api/trades/create` – accepts trade details (pair, type, lot size, prices, etc.) and creates a DB record.  
   - **Read all trades**: GET `/api/trades/get-trades` – returns all trades (no auth filter, but likely used by admin).  
   - **Read user trades**: GET `/api/trades/user-trades` – paginated, sorted trades for the authenticated user.  
   - **Read one trade**: GET `/api/trades/one-trade/[tradeId]`.  
   - **Update**: PATCH `/api/trades/update` – updates select fields.  
   - **Delete**: DELETE `/api/trades/delete`.  
   - **Analytics**: POST `/api/trades/analytics` – returns aggregated stats (total trades, pairs, star ratings, avg lot size) filtered by time range.

3. **Dashboard**  
   - Fetches analytics from `/api/trades/analytics` based on selected filter ("This Week", "This Month", "This Year").  
   - Displays stats via `AnalyticsDashboard` component.

4. **Forex Calculator**  
   - Allows selection of currency pair, inputs for account balance, risk %, stop loss pips.  
   - Fetches live exchange rate via `useCurrencyInfo` hook from Open Exchange Rates.  
   - Calculates position size (lot size) – logic probably in `PositionSizeCard` component.

5. **Home Page (App)**  
   - Carousel of motivational trading tips with autoplay.

### Notable Interfaces / Data Types

- **Trade table** (Prisma model inferred from usage):  
  - `id`, `userId`, `dateTime`, `exitDateTime`, `hoursHeld`, `stars`, `pair`, `tradeType` ("Buy"|"Sell"), `lotSize`, `entryPrice`, `takeProfit`, `stopLoss`, `tpDollars`, `slDollars`, `actualExit`, `actualProfitLoss`, `quickRationale`, `comments`.

- **Analytics response** shape:  
  ```ts
  {
    totalTrades: number;
    pairsUsed: string[];
    starRatings: Record<number, number>;
    avgLotSize: number;
  }
  ```

- **Currency pair format**: `pair: "EUR/USD"`; optionally a `name` for display.

- **Time filter options**: `"This Week"`, `"This Month"`, `"This Year"`, `"All Time"`.

- **Sign-in schema** (Zod): `{ email: string; password: string }`.

- **OTP email props**: `{ username: string; otp: string }`.