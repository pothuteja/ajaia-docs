# AI-Native Workflow Note

## AI Tools Used
- **Gemini:** Used as an architectural thought partner, code generator for boilerplate (Prisma schema, REST API routes, Tiptap toolbar), and debugging assistant.

## Where AI Materially Sped Up Work
- **Scaffolding:** Quickly generated the Prisma relational schema, Zod validation schemas, and Tiptap editor toolbar integration.
- **Error Resolution:** Rapidly diagnosed Windows-specific build issues (Prisma file-locking `EPERM` error, Vitest peer-dependency conflict with `@types/node`, and Next.js 16 `<Suspense>` requirement around `useParams()`).
- **Test Authoring:** Accelerated writing unit tests for role-based access control and XSS-safe `.txt` file parsing.

## What AI Output I Changed or Rejected
- **Database Choice:** Adjusted the initial database recommendation from Neon to Supabase PostgreSQL to match my preferred workflow and connection setup.
- **Dependency Pinning:** Downgraded `vitest` from v5 to v3 and pinned `prisma@6` after encountering peer-dependency and config conflicts with Next.js 16.
- **Route Structure:** Caught and fixed a conflicting route/page path where `/documents/[id]/page.tsx` collided with `/api/documents/[id]/route.ts`.

## Verification & Quality Assurance
- **Automated Testing:** Ran `npm test` (Vitest) — 8/8 tests passing across access control and file-upload parsing/XSS escaping.
- **Production Build Check:** Verified zero TypeScript or Next.js prerender errors via `npm run build`.
- **End-to-End Manual Testing:** Verified document creation, rich-text formatting persistence across page refreshes, `.txt`/`.md` upload and invalid-file rejection, and `OWNER`/`EDITOR`/`VIEWER` sharing flows across all 3 seeded accounts.