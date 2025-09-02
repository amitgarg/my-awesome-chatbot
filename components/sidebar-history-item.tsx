import type { Chat } from "@/lib/db/schema";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";
import { memo } from "react";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { ChatTagDropdown as ChatTagDropdownMenu } from "./tags/chat-tag-dropdown";
import { Tag } from "@/app/(chat)/types";
import { Badge } from "./ui/badge";
import { useFeatureFlag } from "@/hooks/use-feature-flags";

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
  tags,
  onTagsUpdate,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  tags: Array<Tag>;
  onTagsUpdate: (newTags: Array<Tag>) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  const enableChatTags = useFeatureFlag("enableChatTags");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <ChatLabel chat={chat} tags={tags} showTags={enableChatTags} />
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType("private");
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === "private" ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType("public");
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === "public" ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>

          {enableChatTags && (
            <ChatTagDropdownMenu
              chatId={chat.id}
              tags={tags}
              onTagsUpdate={onTagsUpdate}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

function ChatLabel({
  chat,
  tags,
  showTags = true,
}: {
  chat: {
    id: string;
    createdAt: Date;
    title: string;
    userId: string;
    visibility: "public" | "private";
  };
  tags: Tag[];
  showTags: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-0">
      <div>{chat.title}</div>
      {tags.length > 0 && showTags && (
        <div className="flex gap-[0.15rem] flex-wrap h-2 items-center">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="default"
              className="h-2 text-[60%] items-center px-[3px] bg-gray-300"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.tags.length !== nextProps.tags.length) return false;
  if (JSON.stringify(prevProps.tags) !== JSON.stringify(nextProps.tags))
    return false;
  return true;
});
