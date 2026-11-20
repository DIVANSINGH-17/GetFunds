# GetFunds Test-Mode Crowdfunding Portfolio

GetFunds is a full-stack portfolio project built with Next.js 15, React 19, NextAuth, MongoDB, Mongoose, Tailwind CSS, Razorpay Standard Checkout, and MongoDB GridFS.

Razorpay is deliberately restricted to **Test Mode**. The application shows Razorpay's real Checkout UI and mock bank success/failure experience, but test keys cannot move real money. The server rejects any key ID that does not start with `rzp_test_`.

## Interview-friendly features

- GitHub OAuth with collision-safe local user provisioning.
- Server-rendered dashboard protection and session-authorized mutations.
- Razorpay test orders created through a server-only REST API call.
- HMAC-SHA256 payment-signature verification with timing-safe comparison.
- Remote payment amount, currency, order, and status confirmation before completion.
- Idempotent pending-to-completed payment records.
- Editable per-creator funding targets and live progress visualization.
- Global creator search with debounced prefix and similar-name suggestions.
- Public creator pages where visitors can make verified test contributions.
- Creator-owned project folders with MongoDB GridFS file storage.
- Authenticated project upload/delete and safe public file delivery.
- MongoDB aggregation for totals, contribution count, unique supporters, averages, rankings, and recent activity.
- `/explore` leaderboard of top-funded and newest creators, built with a `$group` aggregation and ISR (60s revalidation).
- 30-day contribution trend chart on the dashboard (daily `$dateToString` aggregation with gap filling, dependency-free SVG/CSS bars).
- Goal progress card with "goal reached" states on both the dashboard and public page.
- CSV export of verified contributions (`/api/contributions/export`), session-authorized and protected against spreadsheet formula injection.
- Creator bio and website link, shown on public pages and used for Open Graph metadata.
- Share button (native share sheet with clipboard fallback) and Top/Recent supporter tabs.
- Custom "creator not found" page and per-request deduplicated creator lookups via React `cache`.
- Unit tests for validation and formatting helpers (`npm test`, Node's built-in test runner).

## Local setup

1. Use Node 20:

   ```bash
   nvm use
   ```

2. Copy `.env.example` to `.env.local` and replace every placeholder.

3. Create a GitHub OAuth App with:

   ```text
   Homepage URL: http://localhost:3000
   Callback URL: http://localhost:3000/api/auth/callback/github
   ```

4. In the Razorpay Dashboard, switch to **Test Mode**, generate Test API Keys, and set:

   ```env
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```

   Never use `rzp_live_` keys in this project. Never prefix the secret with `NEXT_PUBLIC_`.

5. Start MongoDB locally or supply a MongoDB Atlas connection string.

6. Install and run:

   ```bash
   npm install
   npm run dev -- --turbopack
   ```

7. Open `http://localhost:3000`.

## Razorpay test payment

1. Search for or open a creator profile.
2. Enter a supporter name, message, and test amount.
3. Open Razorpay Test Checkout.
4. In the UPI test flow, use `success@razorpay` to simulate success or `failure@razorpay` to simulate failure.
5. The contribution appears only after the server verifies the signature and remote payment data.

## Project-folder limits

- Up to 5 files per project folder.
- Up to 5 MB per file.
- Up to 15 MB total per folder.
- Common code, document, image, archive, and text formats are accepted.
- Potentially executable formats such as HTML are forced to download instead of executing in the GetFunds origin.

## Commands

```bash
npm run dev -- --turbopack
npm run lint
npm test
npm run build
npm run start
```

The detailed current architecture is in [`docs/05-current-demo-architecture.md`](docs/05-current-demo-architecture.md). The full learning guide is at [`../GETFUNDS_COMPLETE_PROJECT_GUIDE.md`](../GETFUNDS_COMPLETE_PROJECT_GUIDE.md).
