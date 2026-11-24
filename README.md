# Ajaia Docs — Lightweight Collaborative Document Editor

A full-stack collaborative document editor inspired by Google Docs, built with **Next.js (App Router)**, **TypeScript**, **Tiptap**, **Prisma**, and **PostgreSQL (Supabase)**.

## Features
- **Document Creation & Rich-Text Editing:** Create, rename, edit, delete, and auto-save documents with Bold, Italic, Underline, H1/H2 headings, Bulleted/Numbered lists, and Undo/Redo.
- **File Upload (`.txt` & `.md`):** Import `.txt` or `.md` files (max 2 MB) directly into new editable documents. Markdown is parsed into formatted rich text; plain text is HTML-escaped to prevent XSS.
- **Sharing & Role-Based Access:** Document owners can grant or revoke `EDITOR` or `VIEWER` access by email. The dashboard clearly separates **My Documents** from **Shared With Me**.
- **Persistence:** All documents, formatting (HTML), and sharing permissions persist in PostgreSQL via Prisma.
- **Automated Tests:** Unit tests with Vitest covering access-control rules and file-upload parsing/security.

## Seeded Test Accounts
Use the account switcher in the top-right corner of the dashboard to test sharing flows immediately (no password required):
- `alice@ajaia.dev` (Alice Chen) — Owns the starter document **Q4 Product Roadmap**
- `bob@ajaia.dev` (Bob Patel) — Has `EDITOR` access to Alice's starter document
- `charlie@ajaia.dev` (Charlie Kim) — Clean account for testing new shares (`VIEWER` or `EDITOR`)

## Supported File Types
- `.txt` (Plain text, max 2 MB)
- `.md` (Markdown, max 2 MB)
- Other file types are rejected with a clear validation error.

## Local Setup & Run Instructions

### Prerequisites
- Node.js 20+
- A PostgreSQL database URL (e.g., Supabase, Neon, or local Postgres)

### Steps
1. **Install dependencies:**
   ```bash
   npm install