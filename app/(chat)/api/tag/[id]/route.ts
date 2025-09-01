import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { deleteTag, getTagById, updateTag } from '@/lib/db/queries';

// GET /api/tag/[id] - Get a specific tag
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    const tag = await getTagById({ id });
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Ensure the response is JSON serializable
    const response = {
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt?.toISOString?.() || tag.createdAt,
      createdBy: tag.createdBy,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/tag/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT /api/tag/[id] - Update a specific tag
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if tag exists and belongs to the user
    const existingTag = await getTagById({ id });
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    if (existingTag.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await updateTag({ id, name });

    // Ensure the response is JSON serializable
    const response = {
      id: updated.id,
      name: updated.name,
      createdAt: updated.createdAt?.toISOString?.() || updated.createdAt,
      createdBy: updated.createdBy,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in PUT /api/tag/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE /api/tag/[id] - Delete a specific tag
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Check if tag exists and belongs to the user
    const existingTag = await getTagById({ id });
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    if (existingTag.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = await deleteTag({ id });

    // Ensure the response is JSON serializable
    const response = {
      success: true,
      deleted: {
        id: deleted.id,
        name: deleted.name,
        createdAt: deleted.createdAt?.toISOString?.() || deleted.createdAt,
        createdBy: deleted.createdBy,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in DELETE /api/tag/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
