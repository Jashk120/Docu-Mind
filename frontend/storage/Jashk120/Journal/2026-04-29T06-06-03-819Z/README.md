# Forex Trading Journal

A Next.js application (App Router) for logging and analyzing forex trades. Built with Prisma, React Hook Form, Zod, Axios, and shadcn/ui components.

## Overview

This application provides a complete trading journal system where users can:
- Sign up and authenticate via email/password with OTP verification
- Record trades with detailed parameters (pair, entry/exit prices, lot size, stop loss, take profit, etc.)
- View aggregated analytics (total trades, pairs used, star ratings, average lot size) with time‑range filters
- Use a forex position size calculator based on account balance, risk percentage, and stop loss
- Browse motivational trading tips on the app home page

The app uses Next.js App Router with three layout groups: public landing page, authentication pages, and the authenticated app (with sidebar). API routes handle trade CRUD and analytics.

## Features

- **User Authentication** – sign‑in/registration with JWT tokens and OTP email verification
- **Trade Management** – create, read, update, delete trades; paginated listing of user’s trades
- **Trade Analytics** – aggregate stats (total trades, pairs, star ratings, avg lot size) filterable by week/month/year/all time
- **Forex Position Size Calculator** – compute lot size from account balance, risk %, and stop loss pips, using live exchange rates
- **UI Components** – built with shadcn/ui (sidebar, navbar, cards, carousel) for a consistent look
- **Email Notifications** – OTP verification emails sent via Resend with React Email templates

## File Structure

```
├── const/
│   ├── pairs.ts                 # Currency pairs, commodities, indices, crypto
│   └── useCurrency.ts           # Hook to fetch live exchange rates
├── emails/
│   └── VerificationEmail.tsx    # OTP email template (React Email)
├── src/
│   ├── app/
│   │   ├── (landingPage)/       # Public landing page and layout
│   │   ├── (auth)/              # Sign‑in / sign‑up pages
│   │   ├── (app)/               # Authenticated pages (dashboard, home, calculator, trades)
│   │   └── api/
│   │       └── trades/          # API routes for trade operations
│   │           ├── analytics/
│   │           ├── create/
│   │           ├── delete/
│   │           ├── get-trades/
│   │           ├── one-trade/[tradeId]/
│   │           ├── update/
│   │           └── user-trades/
│   ├── components/              # Reusable UI components (shadcn + app-specific)
│   └── helper/
│       └── getDataFromTokens.ts # Extract user ID from JWT
├── prisma/
│   └── schema.prisma            # Database schema (inferred)
└── .env.local                   # Environment variables
```

## Usage

The following examples illustrate how to interact with the main parts of the application.

### 1. Create a Trade (API)

```typescript
// POST /api/trades/create
const newTrade = {
  pair: "EUR/USD",
  tradeType: "Buy",
  lotSize: 0.5,
  entryPrice: 1.1050,
  takeProfit: 1.1100,
  stopLoss: 1.1000,
  quickRationale: "Bullish breakout on 4H",
};

const response = await fetch("/api/trades/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(newTrade),
});
const createdTrade = await response.json();
```

### 2. Fetch User Trades (API)

```typescript
// GET /api/trades/user-trades?page=1&limit=10
const response = await fetch("/api/trades/user-trades?page=1&limit=10");
const { trades, totalPages } = await response.json();
```

### 3. Get Trade Analytics (API)

```typescript
// POST /api/trades/analytics
const filters = { timeRange: "This Month" };
const response = await fetch("/api/trades/analytics", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(filters),
});
const analytics = await response.json();
// { totalTrades: 15, pairsUsed: ["EUR/USD", "GBP/JPY"], starRatings: {3:5,4:7,5:3}, avgLotSize: 0.45 }
```

### 4. Using the PositionSizeCard Component

```tsx
import { PositionSizeCard } from "@/components/PositionSizeCard";

function CalculatorPage() {
  return (
    <div>
      <h1>Position Size Calculator</h1>
      <PositionSizeCard
        accountBalance={5000}
        riskPercent={2}
        stopLossPips={20}
        pair="EUR/USD"
      />
    </div>
  );
}
```

### 5. Using the useCurrencyInfo Hook

```tsx
import { useCurrencyInfo } from "@/const/useCurrency";

function ExchangeRateDisplay() {
  const { data, loading, error } = useCurrencyInfo("EUR", "USD");
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error fetching rate</p>;
  return <p>EUR/USD rate: {data}</p>;
}
```

### 6. OTP Verification Email (email template usage)

```tsx
import { VerficationEmail } from "@/emails/VerificationEmail";

// Inside an API route that sends email (e.g., Resend)
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "noreply@yourdomain.com",
  to: user.email,
  subject: "Verify your account",
  react: <VerficationEmail username={user.name} otp={generatedOtp} />,
});
```

## Setup

Follow these steps to run the project locally.

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A database (PostgreSQL or SQLite – Prisma supports both)
- Accounts for:
  - [Resend](https://resend.com) (email delivery)
  - [Open Exchange Rates](https://openexchangerates.org) (live forex rates)

### Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/journal?schema=public"
# or for SQLite: "file:./dev.db"

JWT_SECRET="your-secret-key-at-least-32-chars"

# Resend (email)
RESEND_API_KEY="re_..."

# Open Exchange Rates
OPEN_EXCHANGE_RATES_API_KEY="your-api-key"
```

### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Generate Prisma client and apply migrations
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Notes

- The authentication flow assumes JWT tokens are stored in cookies or local storage (implementation details not fully shown). Adjust token storage as needed.
- The `prisma/schema.prisma` is not included in the provided context – run `npx prisma db push` after setting up your `DATABASE_URL` to create the tables (the schema is inferred from the API usage).
- The landing page and auth pages are separate layout groups; the app pages share a sidebar layout.
- The `useCurrencyInfo` hook uses the Open Exchange Rates API. Ensure your API key has access to the required endpoints.
- For production, consider adding rate limiting to API routes and improving token security (e.g., HTTP‑only cookies).
- The email template (`VerificationEmail.tsx`) uses React Email components; you may need to adjust the styling to match your brand.