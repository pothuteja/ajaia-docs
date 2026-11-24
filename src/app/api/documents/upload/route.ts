import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  isSupportedFile,
  MAX_FILE_SIZE_BYTES,
  parseUploadedFileContent,
  stripExtension,
} from '@/lib/file-parser';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please select a file to upload' }, { status: 400 });
    }

    if (!isSupportedFile(file.name)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a .txt or .md file.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 2 MB.' },
        { status: 400 }
      );
    }

    const rawText = await file.text();
    const htmlContent = parseUploadedFileContent(file.name, rawText);
    const title = stripExtension(file.name) || 'Imported Document';

    const doc = await prisma.document.create({
      data: {
        title,
        content: htmlContent,
        ownerId: user.id,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error('POST /api/documents/upload error:', error);
    return NextResponse.json({ error: 'Failed to import file' }, { status: 500 });
  }
}