import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getAllTags,
  createTag,
  getTagByName,
  getTagsByUser,
  getActiveTags,
  getTagsWithUsageCount,
} from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const userId = searchParams.get('userId');
    const active = searchParams.get('active');
    const withUsage = searchParams.get('withUsage');

    // Get specific tag by name
    if (name) {
      const tag = await getTagByName({ name });
      if (!tag) {
        return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
      }
      return NextResponse.json(tag);
    }

    // Get tags created by specific user
    if (userId) {
      const tags = await getTagsByUser({ userId });
      return NextResponse.json(tags);
    }

    // Get only active tags (assigned to chats)
    if (active === 'true') {
      const tags = await getActiveTags();
      return NextResponse.json(tags);
    }

    // Get tags with usage count
    if (withUsage === 'true') {
      const tags = await getTagsWithUsageCount();
      return NextResponse.json(tags);
    }

    // Default: get all tags
    const tags = await getAllTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error in GET /api/tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    console.log('Creating tag:', { name, createdBy: session.user.id });
    const created = await createTag({ name, createdBy: session.user.id });
    console.log('Tag created:', created);

    // Ensure the response is JSON serializable
    const response = {
      id: created.id,
      name: created.name,
      createdAt: created.createdAt?.toISOString?.() || created.createdAt,
      createdBy: created.createdBy,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
