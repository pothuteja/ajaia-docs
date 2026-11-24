```markdown
# Architecture & Prioritization Note

## System Architecture
Ajaia Docs uses a **single-repo layered full-stack architecture** with Next.js (App Router), TypeScript, Prisma, and PostgreSQL (Supabase):

- **Data Layer (`prisma/schema.prisma`):** Three normalized tables—`User`, `Document`, and `DocumentShare`—with cascading deletes and a composite unique constraint (`@@unique([documentId, userId])`) to prevent duplicate shares.
- **Domain / Business Logic Layer (`src/lib/`):** Pure functions for role-based access control (`getDocumentAccessRole`, `canEditDocument`) and file parsing/validation (`isSupportedFile`, `parseUploadedFileContent`). Keeping this logic pure allows fast, deterministic unit testing with Vitest.
- **API Layer (`src/app/api/`):** RESTful route handlers (`/api/users`, `/api/documents`, `/api/documents/[id]`, `/api/documents/[id]/share`, `/api/documents/upload`) with Zod request validation and strict server-side permission checks.
- **Presentation Layer (`src/components/`, `src/app/`):** React client components using Tiptap (`StarterKit` + `Underline`) with debounced 1-second auto-save and optimistic UI feedback.

## Key Tradeoffs & Prioritization
1. **Unified Next.js Full-Stack vs. Separate Express + React:** Keeping frontend and backend in one Next.js codebase eliminated CORS overhead, shared TypeScript types, and enabled 1-click Vercel deployment within the timebox.
2. **Seeded Account Switcher vs. Full OAuth:** Implemented cookie-based account switching across 3 seeded users (`Alice`, `Bob`, `Charlie`) so reviewers can verify `OWNER`, `EDITOR`, and `VIEWER` flows in seconds without signing up.
3. **HTML Storage vs. CRDT/WebSockets:** Persisting Tiptap HTML directly in PostgreSQL guarantees reliable formatting persistence across refreshes without the operational complexity of a WebSocket server.
4. **`.txt` & `.md` Import vs. `.docx` / S3 Storage:** Parsing `.txt` and `.md` directly into editable documents delivers immediate product value without requiring external object storage or paid services.

## What I Would Build Next (With 2–4 More Hours)
- Real-time collaborative editing and presence cursors using Yjs + WebSockets.
- Document version history snapshots with one-click restore.
- Export to PDF and Markdown.
- `.docx` file import using `mammoth`.