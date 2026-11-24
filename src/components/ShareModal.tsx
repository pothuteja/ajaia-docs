'use client';

import { useState } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';

export interface ShareRecord {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ShareModalProps {
  documentId: string;
  documentTitle: string;
  shares: ShareRecord[];
  onClose: () => void;
  onSharesUpdated: (shares: ShareRecord[]) => void;
}

export function ShareModal({
  documentId,
  documentTitle,
  shares,
  onClose,
  onSharesUpdated,
}: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to share document');
        return;
      }

      const filtered = shares.filter((s) => s.user.id !== data.share.user.id);
      onSharesUpdated([...filtered, data.share]);
      setEmail('');
    } catch {
      setError('Network error while sharing document');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(userId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to revoke access');
        return;
      }

      onSharesUpdated(shares.filter((s) => s.user.id !== userId));
    } catch {
      setError('Network error while revoking access');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Share &ldquo;{documentTitle}&rdquo;
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleShare} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              required
              placeholder="bob@ajaia.dev or charlie@ajaia.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Sharing...' : 'Grant Access'}
          </button>
        </form>

        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            People with access ({shares.length})
          </h3>
          {shares.length === 0 ? (
            <p className="text-sm text-slate-400">
              Not shared with anyone yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {share.user.name}
                    </p>
                    <p className="text-xs text-slate-500">{share.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {share.role}
                    </span>
                    <button
                      onClick={() => handleRevoke(share.user.id)}
                      title="Revoke access"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}