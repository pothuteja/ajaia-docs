import { describe, it, expect, vi } from 'vitest';

// Mock server-only modules so pure logic tests run cleanly in Vitest
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('./prisma', () => ({ prisma: {} }));

import { getDocumentAccessRole, canEditDocument } from './auth';
import {
  isSupportedFile,
  stripExtension,
  parseUploadedFileContent,
} from './file-parser';

describe('Document Access Control', () => {
  const ownerId = 'user-alice';
  const shares = [
    { userId: 'user-bob', role: 'EDITOR' },
    { userId: 'user-charlie', role: 'VIEWER' },
  ];

  it('grants OWNER role and edit permission to the document owner', () => {
    const role = getDocumentAccessRole(ownerId, ownerId, shares);
    expect(role).toBe('OWNER');
    expect(canEditDocument(role)).toBe(true);
  });

  it('grants EDITOR role and edit permission to shared editors', () => {
    const role = getDocumentAccessRole('user-bob', ownerId, shares);
    expect(role).toBe('EDITOR');
    expect(canEditDocument(role)).toBe(true);
  });

  it('grants VIEWER role and blocks editing for shared viewers', () => {
    const role = getDocumentAccessRole('user-charlie', ownerId, shares);
    expect(role).toBe('VIEWER');
    expect(canEditDocument(role)).toBe(false);
  });

  it('denies access to users not listed in shares', () => {
    const role = getDocumentAccessRole('user-stranger', ownerId, shares);
    expect(role).toBe('NONE');
    expect(canEditDocument(role)).toBe(false);
  });
});

describe('File Upload Validation & Parsing', () => {
  it('accepts .txt and .md files and rejects unsupported extensions', () => {
    expect(isSupportedFile('notes.txt')).toBe(true);
    expect(isSupportedFile('README.MD')).toBe(true);
    expect(isSupportedFile('malware.exe')).toBe(false);
    expect(isSupportedFile('report.pdf')).toBe(false);
  });

  it('strips file extensions cleanly for document titles', () => {
    expect(stripExtension('Q4-Roadmap.md')).toBe('Q4-Roadmap');
    expect(stripExtension('meeting.notes.txt')).toBe('meeting.notes');
  });

  it('converts Markdown content into formatted HTML', () => {
    const html = parseUploadedFileContent('spec.md', '# Title\n\n**Bold** text');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>Bold</strong>');
  });

  it('escapes raw HTML in .txt uploads to prevent XSS injection', () => {
    const html = parseUploadedFileContent('safe.txt', '<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});