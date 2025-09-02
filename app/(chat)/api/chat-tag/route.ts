import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getTagsByChatId,
  getChatsByTagId,
  addTagToChat,
  removeTagFromChat,
  getAllChatTags,
} from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const tagId = searchParams.get('tagId');
    const all = searchParams.get('all');

    // Get all chat tags for the user (merged from /api/chat-tag/all)
    if (all === 'true') {
      const chatTags = await getAllChatTags({ userId: session.user.id });

      // Group tags by chatId for efficient lookup
      const tagsByChat: Record<string, Array<{ id: string; name: string }>> = {};

      chatTags.forEach((chatTag) => {
        if (!tagsByChat[chatTag.chatId]) {
          tagsByChat[chatTag.chatId] = [];
        }
        tagsByChat[chatTag.chatId].push({
          id: chatTag.tagId,
          name: chatTag.tagName,
        });
      });

      return NextResponse.json(tagsByChat);
    }

    if (chatId) {
      // List tags for a chat
      const tags = await getTagsByChatId({ chatId });
      return NextResponse.json(tags);
    }

    if (tagId) {
      // List chats for a tag
      const chats = await getChatsByTagId({ tagId });
      return NextResponse.json(chats);
    }

    return NextResponse.json(
      { error: 'chatId, tagId, or all=true required' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error in GET /api/chat-tag:', error);
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

    // Assign a tag to a chat
    const { chatId, tagId } = await req.json();
    if (!chatId || !tagId)
      return NextResponse.json(
        { error: 'chatId and tagId are required' },
        { status: 400 },
      );

    const created = await addTagToChat({ chatId, tagId });
    return NextResponse.json(created);
  } catch (error) {
    console.error('Error in POST /api/chat-tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Unassign a tag from a chat
    const { chatId, tagId } = await req.json();
    if (!chatId || !tagId)
      return NextResponse.json(
        { error: 'chatId and tagId are required' },
        { status: 400 },
      );

    await removeTagFromChat({ chatId, tagId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat-tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
