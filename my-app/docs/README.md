# GetFunds project documentation

This documentation explains the GetFunds crowdfunding application from current and historical views.

| Document | Best used for | Main question answered |
|---|---|---|
| [In-and-out project notes](./06-in-and-out-project-notes.md) | **Complete technical handbook** | How does every current layer, dependency, lifecycle, model, edge case, and production risk work? |
| [Current demo architecture](./05-current-demo-architecture.md) | **Start here** | What does the refactored, no-real-money implementation do now? |
| [High-level system diagram](./01-high-level-system-diagram.md) | First overview | Who uses the system, and which external systems does it depend on? |
| [Workflow diagrams](./02-workflow-diagrams.md) | Request and user flows | What happens during login, profile setup, page viewing, and payment? |
| [Architecture diagram](./03-architecture-diagram.md) | Technical deep dive | How are the UI, server code, authentication, database, and Razorpay integration organized? |
| [Resume and interview guide](./04-resume-and-interview-guide.md) | Interview preparation | How does the code support each resume bullet, and how should the project be explained accurately? |
| [Rendered image gallery](./images/README.md) | Slides, reports, and visual review | Where can I open or download PNG and SVG versions of every diagram? |

## Suggested reading order

1. Start with the current demo architecture for a short overview.
2. Read the in-and-out project notes for the complete source-verified explanation.
3. Use documents 01-04 to study the original Razorpay prototype and its shortcomings.
4. Compare both versions to explain the refactoring decisions in an interview.

## Project vocabulary

- **Creator**: an authenticated GitHub user who owns a public fundraising page.
- **Supporter**: a visitor who opens a creator's page and attempts a contribution.
- **Fundraising page**: the dynamic `/{username}` route. In the current data model, this page is the campaign; there is no separate `Campaign` collection.
- **Pending payment**: a `Payment` document created after Razorpay creates an order, with `done: false`.
- **Completed payment**: a payment whose `done` field has been verified and changed to `true`.

## Important scope note

The application was refactored on 2026-08-30 into a safe demo-contribution product with creator analytics. Documents 01-04 preserve the original Razorpay-oriented implementation for historical learning. Document 05 is the short current-runtime description; document 06 is the comprehensive current-runtime handbook.
