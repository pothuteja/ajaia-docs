'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Upload,
  Users,
  Trash2,
  UserCircle,
  Loader2,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface DocSummary {
  id: string;
  title: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string };
  shares?: Array<{ id: string; role: string; user: User }>;
  myRole?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ownedDocs, setOwnedDocs] = useState<DocSummary[]>([]);
  const [sharedDocs, setSharedDocs] = useState<DocSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, docsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/documents'),
      ]);

      if (!usersRes.ok || !docsRes.ok) {
        throw new Error('Failed to load workspace data');
      }

      const usersData = await usersRes.json();
      const docsData = await docsRes.json();

      setUsers(usersData.users || []);
      setCurrentUser(usersData.currentUser || null);
      setOwnedDocs(docsData.owned || []);
      setSharedDocs(docsData.shared || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleSwitchUser(userId: string) {
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Failed to switch user');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch account');
    }
  }

  async function handleCreateDocument() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create document');
      router.push(`/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      setCreating(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import file');
      }

      router.push(`/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteDocument(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete document');
      }
      setOwnedDocs((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-900">
                Ajaia Docs
              </h1>
              <p className="text-xs text-slate-500">
                Lightweight Collaborative Workspace
              </p>
            </div>
          </div>

          {/* Account Switcher for Easy Reviewer Testing */}
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-slate-400" />
            <label htmlFor="user-switcher" className="sr-only">
              Active User
            </label>
            <select
              id="user-switcher"
              value={currentUser?.id || ''}
              onChange={(e) => handleSwitchUser(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Action Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
            <p className="text-sm text-slate-500">
              Create a blank document or import a <strong>.txt</strong> or{' '}
              <strong>.md</strong> file (max 2 MB).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Importing...' : 'Import .txt / .md'}
            </button>

            <button
              onClick={handleCreateDocument}
              disabled={creating}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {creating ? 'Creating...' : 'New Document'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading workspace...
          </div>
        ) : (
          <div className="space-y-10">
            {/* Section 1: Owned Documents */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  My Documents ({ownedDocs.length})
                </h3>
              </div>

              {ownedDocs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  You haven&apos;t created any documents yet. Click{' '}
                  <strong>New Document</strong> or import a file above.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ownedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="line-clamp-1 text-base font-semibold text-slate-900 hover:text-blue-600"
                          >
                            {doc.title}
                          </Link>
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Owner
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Updated {new Date(doc.updatedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">
                          {doc.shares && doc.shares.length > 0
                            ? `Shared with ${doc.shares.length} ${
                                doc.shares.length === 1 ? 'person' : 'people'
                              }`
                            : 'Private'}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            Open
                          </Link>
                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                            title="Delete document"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 2: Shared With Me */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Shared With Me ({sharedDocs.length})
                </h3>
              </div>

              {sharedDocs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No documents have been shared with {currentUser?.name} yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                    >
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <span className="line-clamp-1 text-base font-semibold text-slate-900">
                            {doc.title}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              doc.myRole === 'VIEWER'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {doc.myRole === 'VIEWER' ? 'Viewer' : 'Editor'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Owner: <strong>{doc.owner.name}</strong>
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-400">
                          Updated {new Date(doc.updatedAt).toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-emerald-600">
                          Open &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}