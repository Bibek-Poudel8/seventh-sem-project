# Personal Finance App — Full Architecture Specification

---

## 1. Key Architectural Decisions (MANDATORY)

1. **Server-first architecture** — All data fetching MUST happen in Server Components (`page.tsx`). Avoid unnecessary client-side fetching.
2. **Server Actions for mutations** — Forms MUST use server actions. Avoid traditional API calls unless required (e.g., AI service).
3. **Thin API Layer** — Only used for external integrations (AI service) and webhooks (future). NOT for standard CRUD.
4. **Authentication already implemented** — Extend with a custom `useAuth` hook.

---

## 2. Folder Structure

```
/app
  /(auth)
    /login
    /register

  /dashboard
    page.tsx

  /transactions
    page.tsx
    actions.ts

  /budgets
    page.tsx
    actions.ts

  /settings
    page.tsx

  /api
    /ai
      /categorize/route.ts
      /predict/route.ts
    /export
      /csv/route.ts
      /pdf/route.ts
    /notifications
      /route.ts

/components
  /ui
  /forms
  /charts
  /layout
  /notifications

/services
  transaction.service.ts
  budget.service.ts
  analytics.service.ts
  ai.service.ts
  export.service.ts
  notification.service.ts

/lib
  prisma.ts
  auth.ts
  pwa.ts

/hooks
  useAuth.ts
  useNotifications.ts

/public
  manifest.json
  sw.js             ← PWA service worker

/types
/utils
```

---

## 3. AI Communication — REST API Bridge

The Next.js app communicates with the Python ML server exclusively through the `/api/ai/*` route handlers. These routes act as a secure proxy — the ML server URL and any API keys are never exposed to the client.

### `/api/ai/categorize/route.ts`

**Triggered by:** `transaction.service.ts` after a transaction is created or edited.

**Request to Python server:**
```json
POST http://ml-server/categorize
{
  "description": "Starbucks Coffee",
  "amount": 5.50,
  "merchant": "Starbucks"
}
```

**Response from Python server:**
```json
{
  "category": "Food & Drink",
  "confidence": 0.94,
  "suggested_categories": ["Food & Drink", "Entertainment"]
}
```

**Next.js route handler behavior:**
- Validates the incoming request (Zod)
- Forwards to Python ML server via `fetch`
- Returns the category and confidence to the service layer
- If Python server is unavailable, returns a fallback category of `"Uncategorized"` with `confidence: 0`

### `/api/ai/predict/route.ts`

**Triggered by:** `analytics.service.ts` for the dashboard predictions widget.

**Request to Python server:**
```json
POST http://ml-server/predict
{
  "user_id": "abc123",
  "transactions": [ ...last 90 days of transactions... ],
  "budgets": [ ...current budgets... ]
}
```

**Response from Python server:**
```json
{
  "predicted_spending": {
    "Food & Drink": 320.00,
    "Transport": 95.00
  },
  "risk_categories": ["Food & Drink"],
  "monthly_forecast": 1450.00,
  "insight": "Your Food & Drink spending is trending 18% above your budget."
}
```

**Next.js route handler behavior:**
- Validates session (only the authenticated user's data is sent)
- Batches transactions before sending (max 500 records)
- Caches result in memory for 1 hour per user to avoid repeated ML calls
- Returns predictions to the service layer

### `ai.service.ts`

```typescript
// All AI calls go through this service. NEVER call /api/ai/* directly from components or actions.

export async function categorizeTransaction(description: string, amount: number, merchant?: string) {
  const res = await fetch("/api/ai/categorize", { method: "POST", body: JSON.stringify({ description, amount, merchant }) })
  return res.json() // { category, confidence }
}

export async function getPredictions(userId: string) {
  const res = await fetch("/api/ai/predict", { method: "POST", body: JSON.stringify({ userId }) })
  return res.json() // { predicted_spending, risk_categories, monthly_forecast, insight }
}
```

---

## 4. Authentication

### Strategy
- NextAuth.js with Credentials provider + OAuth (Google, GitHub)
- Sessions stored in JWT (stateless, works well with Server Components)
- All pages except `/login` and `/register` redirect unauthenticated users

### `useAuth` Hook (Client Components only)
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const { data: session, status } = useSession()
  return {
    user: session?.user ?? null,
    loading: status === "loading",
    isAuthenticated: status === "authenticated"
  }
}
```

Server Components use `getServerSession(authOptions)` directly.

---

## 5. Data Fetching Strategy

### Rule: All pages fetch data in `page.tsx` (Server Component)

```typescript
// Example: app/transactions/page.tsx
const session = await getServerSession(authOptions)
if (!session) redirect("/login")
const transactions = await transactionService.getUserTransactions(session.user.id)
return <TransactionsPage data={transactions} />
```

---

## 6. Server Actions Pattern

Each feature has its own `actions.ts` with `"use server"` directive. Every action must:
- Validate input with Zod
- Call the service layer (never Prisma directly)
- Call `revalidatePath()` after mutations

---

---

# PAGE-BY-PAGE ARCHITECTURE

---

## 6.1 Dashboard Page

### Responsibility
The dashboard is the financial command center. It must immediately answer: "How am I doing this month?" It shows aggregate analytics, recent activity, budget health, and AI-generated insights — all fetched server-side.

### Data Fetched (Server-Side in `page.tsx`)

| Data | Source | Description |
|---|---|---|
| `totalIncome` | `analytics.service` | Sum of income transactions this month |
| `totalExpenses` | `analytics.service` | Sum of expense transactions this month |
| `netBalance` | Computed | `totalIncome - totalExpenses` |
| `categoryBreakdown` | `analytics.service` | Expenses grouped by category for current month |
| `monthlyTrend` | `analytics.service` | Income vs expenses per month for last 6 months |
| `recentTransactions` | `transaction.service` | Last 5 transactions |
| `activeBudgets` | `budget.service` | All active budgets with current spend |
| `predictions` | `ai.service` | ML forecast and AI insight text |

### Server Data Flow
```
page.tsx
  ↓ (parallel fetches with Promise.all)
analytics.service.ts → prisma
transaction.service.ts → prisma
budget.service.ts → prisma
ai.service.ts → /api/ai/predict → Python ML Server
```

### Layout — Grid Structure

The dashboard uses a 12-column responsive grid. On mobile it stacks to a single column.

```
[ Summary Card: Balance ] [ Summary Card: Income ] [ Summary Card: Expenses ] [ Summary Card: Savings Rate ]
[ ---- Spending by Category (Pie/Donut Chart) ---- ] [ ---- Monthly Trend (Bar/Line Chart) ---- ]
[ ---- Budget Progress (horizontal bars) ---- ] [ ---- AI Insight Panel ---- ]
[ ---- Recent Transactions (table/list) ---- ]
```

### Component: Summary Cards (4 cards)

These are server-rendered static components — no client JS needed.

| Card | Value | Sub-label | Color Indicator |
|---|---|---|---|
| Net Balance | `$2,340.50` | "This month" | Green if positive, Red if negative |
| Total Income | `$4,000.00` | vs. last month `+5%` | Green |
| Total Expenses | `$1,659.50` | vs. last month `-3%` | Red |
| Savings Rate | `41.5%` | "of income saved" | Color-coded: green >30%, yellow 15-30%, red <15% |

Each card shows a percentage change vs. the previous month (e.g., `↑ 5% from last month`), calculated server-side.

### Component: Spending by Category — Donut Chart

**Type:** Interactive Donut Chart (Recharts — client component)
**Data shape passed as prop:**
```json
[
  { "category": "Food & Drink", "amount": 420, "color": "#F59E0B" },
  { "category": "Transport",    "amount": 180, "color": "#3B82F6" },
  { "category": "Utilities",    "amount": 95,  "color": "#8B5CF6" }
]
```

**Behavior:**
- Hovering a segment highlights it and shows a tooltip: `Food & Drink — $420 (25.3%)`
- Clicking a segment navigates to `/transactions?category=Food+%26+Drink` (filtered view)
- Center of the donut shows total spend: `$1,659`
- Legend below the chart lists each category with color dot, name, amount, and percentage

### Component: Monthly Trend — Grouped Bar Chart

**Type:** Grouped Bar Chart with line overlay (Recharts — client component)
**X-axis:** Last 6 months (e.g., Nov, Dec, Jan, Feb, Mar, Apr)
**Y-axis:** Amount in currency (NPR or user's preferred currency)
**Series:**
- Blue bars: Income per month
- Red bars: Expenses per month
- Green line overlay: Net savings per month

**Behavior:**
- Hovering a bar group shows a tooltip with: Income, Expenses, Net for that month
- A small "vs last month" delta is shown in the tooltip
- Chart is responsive and scrollable on mobile

### Component: Budget Progress Bars

**Data shape:**
```json
[
  { "name": "Food & Drink", "limit": 500, "spent": 420, "remaining": 80 },
  { "name": "Transport",    "limit": 200, "spent": 180, "remaining": 20 }
]
```

**Behavior:**
- Each budget is a horizontal progress bar
- Bar fills proportionally: `spent / limit * 100%`
- Color coding:
  - 0–75% spent: Green
  - 75–90% spent: Yellow/Amber
  - 90–100% spent: Orange
  - Over 100%: Red (overflowing bar with warning icon)
- Shows: `$420 / $500 — $80 remaining`
- Clicking a budget navigates to `/budgets#food-and-drink`
- Maximum 4 budgets shown; a "View All Budgets" link appears if more exist

### Component: AI Insight Panel

**Layout:** Card with a subtle gradient background (indigo to violet), robot/sparkle icon

**Content:**
- Headline: AI-generated short insight, e.g., `"Your Food & Drink spending is trending 18% above budget"`
- Sub-text: Predicted total spend this month: `Forecast: $1,850 (budget: $1,700)`
- List of 1–3 risk categories flagged by the model
- A "View Predictions" link that scrolls to the monthly trend chart or navigates to a deeper analytics view

**Behavior:**
- If AI service is unavailable, panel shows a soft "AI insights unavailable right now" with a retry button (client component with local state)
- The insight text is directly from the ML server's `insight` field
- This is a client component only for the retry button; otherwise server-rendered

### Component: Recent Transactions List

**Shows:** Last 5 transactions in a compact list

**Each row shows:**
- Category icon (colored circle matching the category color)
- Transaction description (truncated at 30 chars)
- Category label
- Date (e.g., `Apr 3`)
- Amount (red for expense, green for income)
- AI confidence badge (shown if < 80%): `⚠ AI: 72%` indicating the category may need review

**Behavior:**
- Clicking a row opens a transaction detail drawer/modal (client component)
- "View All Transactions" link at the bottom navigates to `/transactions`

---

## 6.2 Transactions Page

### Responsibility
Full transaction management: view, search, filter, add, edit, delete, and export.

### Data Fetched (Server-Side)
- All transactions for the user (paginated, 20 per page)
- Filter params read from URL search params (`?category=Food&date_from=2024-01-01&amount_min=10`)
- Category list (for filter dropdown)

### Layout

```
[ Page Title: Transactions ]  [ + Add Transaction Button ]  [ Export Button (CSV/PDF) ]
[ Filter Bar: Date Range | Category | Amount Range | Keyword Search ]
[ Transactions Table / Card List ]
[ Pagination ]
```

### Component: Filter Bar

**Filters available:**
| Filter | Type | Behavior |
|---|---|---|
| Date Range | Date picker (from / to) | Filters by transaction date |
| Category | Multi-select dropdown | Shows all user categories |
| Amount | Range slider + input fields (min / max) | Filters by transaction amount |
| Keyword | Text input | Searches description field (case-insensitive, debounced 300ms) |
| Type | Toggle: All / Income / Expense | Filters by transaction type |

Filters update URL search params via `router.push` (client component). The page re-renders server-side with the new filter params. This makes filters shareable via URL.

### Component: Transaction Table

**Columns:**
| Column | Description |
|---|---|
| Date | Formatted date, sortable |
| Description | Transaction description |
| Category | Color-coded pill badge |
| Amount | Red for expense, Green for income |
| AI Confidence | Progress bar 0–100%, only shown if < 85% |
| Actions | Edit icon, Delete icon |

**Behavior:**
- Clicking a row expands an inline detail row (or opens a side drawer on mobile)
- Column headers are clickable for sorting (updates URL params)
- Bulk select checkbox column for bulk delete or export
- Empty state shows "No transactions found" with a CTA to add the first one

### Component: Add/Edit Transaction Form (Modal/Drawer)

**Fields:**
| Field | Type | Rules |
|---|---|---|
| Description | Text input | Required, max 100 chars |
| Amount | Number input | Required, positive number |
| Type | Radio: Income / Expense | Required |
| Date | Date picker | Required, defaults to today |
| Category | Dropdown (auto-filled by AI) | Required |
| Notes | Textarea | Optional, max 300 chars |
| Merchant | Text input | Optional, used for AI categorization |

**AI Auto-Categorization behavior:**
- When the user finishes typing the description (on blur), the form sends the description + amount to `ai.service` in the background
- A small spinner appears next to the Category field
- When the AI responds, the Category dropdown is auto-populated
- A small badge shows: `AI suggested (94% confidence)` — user can override
- If confidence < 70%, the badge shows a warning icon prompting review

**Server Action: `createTransaction()`**
```typescript
"use server"
// 1. Zod validation
// 2. Call ai.service.categorizeTransaction() if category not manually set
// 3. Call transaction.service.createTransaction()
// 4. Call notification.service.checkBudgetLimits() — triggers notification if budget exceeded
// 5. revalidatePath("/transactions")
// 6. revalidatePath("/dashboard")
```

### Component: Export Button

- Opens a small dropdown: "Export as CSV" / "Export as PDF"
- Exports respect current active filters (not all transactions)
- Calls `/api/export/csv` or `/api/export/pdf` with current filter params as query string
- PDF export uses `pdfkit` or `@react-pdf/renderer` server-side
- CSV export streams the response directly

---

## 6.3 Budgets Page

### Responsibility
Create, manage, and monitor spending budgets by category. Visual progress tracking with alerts.

### Data Fetched (Server-Side)
- All active budgets with their spending summary (joined with transactions)
- Total monthly income (for budget-to-income ratio display)
- Notification preferences for each budget

### Layout

```
[ Page Title: Budgets ]  [ + Create Budget Button ]
[ Budget Summary: Total budgeted | Total spent | Remaining ]
[ Budget Cards Grid (2 or 3 columns) ]
[ Completed / Inactive Budgets (collapsed accordion) ]
```

### Component: Budget Summary Bar

A horizontal bar at the top showing:
- Total budgeted this month: `$2,000`
- Total spent against budgets: `$1,340`
- Remaining: `$660`
- Percentage of income committed to budgets: `50% of income`

### Component: Budget Card

Each budget has its own card showing:

**Header:**
- Category icon and name (e.g., 🍔 Food & Drink)
- Budget period (e.g., Monthly — April 2025)
- Three-dot menu: Edit, Delete, Pause

**Body:**
- Large circular progress ring showing `spent / limit` percentage
- Center of ring: `$420 / $500`
- Below ring: `$80 remaining` or `$80 over budget` (in red)
- Color: Green → Yellow → Red as described in Dashboard section

**Footer:**
- Spending trend sparkline (last 4 weeks mini line chart)
- Toggle: "Notify me when 80% reached" (saves via server action)

### Component: Create/Edit Budget Form (Modal)

**Fields:**
| Field | Type | Rules |
|---|---|---|
| Category | Dropdown (same categories as transactions) | Required |
| Limit Amount | Number input | Required, positive |
| Period | Select: Weekly / Monthly / Custom | Required |
| Start Date | Date picker | Required |
| End Date | Date picker | Only for Custom period |
| Notify at | Slider: 50% / 75% / 90% / 100% | Default 80% |
| Notes | Textarea | Optional |

**Server Action: `createBudget()`**
```typescript
"use server"
// 1. Zod validation
// 2. Check for duplicate budget (same category + overlapping period)
// 3. budget.service.createBudget()
// 4. revalidatePath("/budgets")
// 5. revalidatePath("/dashboard")
```

### Budget Notifications Logic

Triggered inside `transaction.service.createTransaction()` after each new transaction:
```
notification.service.checkBudgetLimits(userId, category, newSpendTotal)
  → If spend >= notifyAt% of limit:
      → Create a notification record in DB
      → (Optional) Send push notification via Web Push API
```

---

## 6.4 Settings Page

### Responsibility
User profile management, credential changes, notification preferences, and PWA settings.

### Data Fetched (Server-Side)
- User profile (name, email, avatar, preferences)
- Connected OAuth providers
- Notification preferences

### Layout (Tabbed)

```
[ Profile ] [ Security ] [ Preferences ] [ Notifications ] [ Data ]
```

### Tab: Profile

**Fields:**
- Avatar upload (preview + crop)
- Full name (text input)
- Email (text input — triggers re-verification if changed)
- Currency preference (dropdown: USD, EUR, NPR, etc.)
- Timezone (dropdown)

**Server Action: `updateProfile()`**
- Validates new email format
- If email changed: marks as unverified and sends verification email via NextAuth
- Updates user record via `user.service`
- `revalidatePath("/settings")`

### Tab: Security

**Sections:**
- Change Password (current password, new password, confirm — only for Credentials users)
- Connected OAuth Providers (shows Google/GitHub with "Connect" or "Disconnect" buttons)
- Active Sessions (list of logged-in devices with "Revoke" button)
- Two-factor authentication toggle (future — marked as "Coming Soon")

### Tab: Preferences

**Fields:**
- Default transaction type (Income / Expense)
- Week starts on (Monday / Sunday)
- Date format (MM/DD/YYYY or DD/MM/YYYY or YYYY-MM-DD)
- Dark mode toggle (saved to DB, not just localStorage — so it persists across devices)
- Language (English only for now, scaffold for i18n)

### Tab: Notifications

**Fields per notification type:**

| Notification | Toggle | Channel |
|---|---|---|
| Budget limit reached | On/Off | In-app / Push |
| Budget 75% warning | On/Off | In-app / Push |
| Weekly spending summary | On/Off | In-app |
| New AI insight available | On/Off | In-app |
| Transaction added | On/Off | In-app |

**Push Notifications:**
- "Enable Push Notifications" button (Web Push API)
- On click: prompts browser permission → saves subscription to DB
- Uses `notification.service.ts` + `/api/notifications/route.ts` for dispatch

### Tab: Data

**Sections:**
- **Export All Data:** Button to export full transaction history as CSV or PDF (same as Transactions page export, but unfiltered)
- **Import Transactions:** CSV upload with column mapping UI (future — marked as "Coming Soon")
- **Delete Account:** Red button with confirmation modal; deletes all user data via `user.service.deleteAccount()`

---

## 7. Service Layer (Strict Rules)

All business logic lives here. Services are called by server actions and page.tsx. Never by components.

### `transaction.service.ts`
- `getUserTransactions(userId, filters)` — paginated, filtered
- `createTransaction(data)` — calls `ai.service.categorize()`, then inserts, then `notification.service.checkBudgetLimits()`
- `updateTransaction(id, data)` — re-categorizes if description changed
- `deleteTransaction(id)` — also updates budget spend totals

### `budget.service.ts`
- `getUserBudgets(userId)` — includes joined spending totals
- `createBudget(data)`
- `updateBudget(id, data)`
- `deleteBudget(id)`
- `getBudgetSpend(budgetId)` — used for real-time card updates

### `analytics.service.ts`
- `getMonthlySummary(userId, month)` — income, expenses, net
- `getCategoryBreakdown(userId, month)` — for donut chart
- `getMonthlyTrend(userId, months)` — for bar chart
- `getRecentTransactions(userId, limit)` — for dashboard widget

### `ai.service.ts`
- `categorizeTransaction(description, amount, merchant?)` — calls `/api/ai/categorize`
- `getPredictions(userId)` — calls `/api/ai/predict`

### `export.service.ts`
- `exportCSV(userId, filters)` — streams CSV
- `exportPDF(userId, filters)` — generates PDF buffer

### `notification.service.ts`
- `checkBudgetLimits(userId, category, spendTotal)` — creates notification records
- `getUserNotifications(userId)` — for notification bell
- `markAsRead(notificationId)`
- `sendPushNotification(userId, payload)` — Web Push dispatch

---

## 8. PWA Implementation

### Files Required
- `/public/manifest.json` — App name, icons, theme color, `display: "standalone"`
- `/public/sw.js` — Service worker: cache static assets, background sync for offline-created transactions
- In `app/layout.tsx`: `<link rel="manifest" href="/manifest.json" />` and service worker registration script

### Offline Behavior
- Dashboard: Shows cached last-fetched data with a "Last updated: X minutes ago" banner
- Transactions: Allows viewing cached transactions; add/edit/delete queued and synced when online
- Background sync: Uses `sync` event in service worker to flush offline mutations

---

## 9. Notification Bell (Global UI Component)

Located in the top navigation bar. This is a client component.

**Behavior:**
- Bell icon with unread count badge (e.g., 🔔 3)
- Clicking opens a dropdown showing last 10 notifications
- Each notification shows: icon, message, relative time (e.g., "2 hours ago"), unread dot
- "Mark all as read" button at the top of the dropdown
- Notifications auto-refresh every 60 seconds via `setInterval` polling (or use Server-Sent Events for real-time)

---

## 10. Revalidation Strategy

| Trigger | Revalidated Paths |
|---|---|
| Create/Edit/Delete Transaction | `/transactions`, `/dashboard` |
| Create/Edit/Delete Budget | `/budgets`, `/dashboard` |
| Update Profile/Preferences | `/settings` |
| Mark notification read | No path revalidation — client state update only |

---

## 11. What NOT to Do

- No client-side fetching with `useEffect` + `fetch` unless it is a truly dynamic real-time update
- No direct Prisma in components or server actions
- No business logic in server actions — call the service layer
- No AI calls outside `ai.service.ts`
- No ML server URL or keys exposed to the client

---

## 12. Implementation Order

1. Authentication (login, register, useAuth, session)
2. Dashboard page (read-only, all server-side)
3. Transaction CRUD (service + actions + page)
4. AI categorization bridge (ai.service → /api/ai/categorize → Python)
5. Budget management (service + actions + page)
6. Analytics (analytics.service + dashboard charts)
7. AI predictions (ai.service.getPredictions → /api/ai/predict)
8. Export (export.service + /api/export/*)
9. Notifications (notification.service + bell component + push)
10. Settings page (profile, security, preferences, data)
11. PWA (manifest + service worker)
