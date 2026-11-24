'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Share2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ShareModal, ShareRecord } from '@/components/ShareModal';

interface DocumentData {
  id: string;
  title: string;
  content: string;
  owner: { id: string; name: string; email: string };
  shares: ShareRecord[];
}

function DocumentEditorContent() {
  const params = useParams<{ id: string }>();
  const docId = params.id;

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [role, setRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER'>('VIEWER');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canEdit = role === 'OWNER' || role === 'EDITOR';

  useEffect(() => {
    async function fetchDocument() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/documents/${docId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Could not load document');
        }

        setDoc(data.document);
        setRole(data.role);
        setTitle(data.document.title);
        setContent(data.document.content);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }

    if (docId) fetchDocument();
  }, [docId]);

  const saveDocument = useCallback(
    async (nextTitle: string, nextContent: string) => {
      if (!canEdit) return;
      const trimmedTitle = nextTitle.trim() || 'Untitled Document';

      setSaveStatus('saving');
      setSaveError(null);

      try {
        const res = await fetch(`/api/documents/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmedTitle, content: nextContent }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to save changes');
        }

        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
        setSaveError(err instanceof Error ? err.message : 'Save failed');
      }
    },
    [canEdit, docId]
  );

  function scheduleAutoSave(nextTitle: string, nextContent: string) {
    if (!canEdit) return;
    setSaveStatus('unsaved');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDocument(nextTitle, nextContent);
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading document...
      </div>
    );
  }

  if (loadError || !doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-red-500" />
        <h1 className="mb-1 text-xl font-semibold text-slate-900">
          Unable to open document
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          {loadError || 'This document does not exist or you do not have permission.'}
        </p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Editor Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="flex flex-1 items-center gap-3">
            <Link
              href="/"
              title="Back to Dashboard"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex-1">
              <input
                type="text"
                value={title}
                disabled={!canEdit}
                onChange={(e) => {
                  setTitle(e.target.value);
                  scheduleAutoSave(e.target.value, content);
                }}
                placeholder="Untitled Document"
                className="w-full rounded-md border border-transparent px-2 py-1 text-lg font-semibold text-slate-900 hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none disabled:hover:border-transparent"
              />
              <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
                <span>Owner: {doc.owner.name}</span>
                <span>&bull;</span>
                <span className="font-medium text-slate-700">{role}</span>
              </div>
            </div>
          </div>

          {/* Right Controls: Save Status, Save Button, Share Button */}
          <div className="flex items-center gap-3">
            {canEdit && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    <span>Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Saved</span>
                  </>
                )}
                {saveStatus === 'unsaved' && <span>Unsaved changes</span>}
                {saveStatus === 'error' && (
                  <span className="text-red-600">{saveError || 'Save failed'}</span>
                )}
              </div>
            )}

            {canEdit && (
              <button
                onClick={() => {
                  if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
                  saveDocument(title, content);
                }}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            )}

            {role === 'OWNER' && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Rich-Text Editor Body */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <RichTextEditor
          content={content}
          editable={canEdit}
          onChange={(html) => {
            setContent(html);
            scheduleAutoSave(title, html);
          }}
        />
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          documentId={doc.id}
          documentTitle={title}
          shares={doc.shares}
          onClose={() => setShowShareModal(false)}
          onSharesUpdated={(updatedShares) =>
            setDoc((prev) => (prev ? { ...prev, shares: updatedShares } : prev))
          }
        />
      )}
    </div>
  );
}
export default function DocumentEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
          Loading document...
        </div>
      }
    >
      <DocumentEditorContent />
    </Suspense>
  );
}