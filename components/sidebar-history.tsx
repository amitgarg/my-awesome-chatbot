"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { motion } from "framer-motion";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { ChatItem } from "./sidebar-history-item";
import useSWRInfinite from "swr/infinite";
import { LoaderIcon } from "./icons";
import { useDeleteChat } from "@/hooks/use-delete-chat";
import { useState } from "react";
import TagManager from "./tags/tag-manager";
import useSWR from "swr";
import { Tag } from "@/app/(chat)/types";

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats
  );
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) return null;

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
  });

  // Fetch all chat tags in a single call
  const { data: allChatTags, mutate: mutateChatTags } = useSWR<
    Record<string, Array<Tag>>
  >(user ? "/api/chat-tag?all=true" : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // Cache for 5 minutes
  });

  const router = useRouter();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleDeleteSuccess = () => {
    mutate((chatHistories) => {
      if (chatHistories) {
        return chatHistories.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
        }));
      }
    });

    // Navigate away if we deleted the current chat
    if (deleteId === (Array.isArray(id) ? id[0] : id)) {
      router.push("/");
    }
  };

  const { deleteId, openDeleteDialog, DeleteDialog } =
    useDeleteChat(handleDeleteSuccess);

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const totalChats = paginatedChatHistories?.flatMap((page) => page.chats);
  const filteredChats = totalChats?.filter((chat) => {
    // Filter by selected tags
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((selectedTagId) =>
        (allChatTags?.[chat.id] || []).some((tag) => tag.id === selectedTagId)
      );

    return matchesTags;
  });

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      "--skeleton-width": `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <TagManager
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        user={user?.id ? { id: user.id } : null}
        onTagsDeleted={() => {
          // Force refetch chat tags to get updated data
          mutateChatTags();
        }}
      />

      {/* Tag Filter Results Summary */}
      {selectedTags.length > 0 && (
        <div className="px-2 py-1">
          <div className="text-xs text-sidebar-foreground/50 flex items-center gap-2">
            <span>
              {`${filteredChats?.length} of ${totalChats?.length} chats`}
            </span>
            <span className="text-primary">• Tag filters active</span>
          </div>
        </div>
      )}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {paginatedChatHistories &&
              (() => {
                const groupedChats = groupChatsByDate(filteredChats || []);

                // Check if any chats match the filters
                const hasFilteredResults = Object.values(groupedChats).some(
                  (group) => group.length > 0
                );

                if (!hasFilteredResults) {
                  return (
                    <div className="px-2 py-8 text-center text-sidebar-foreground/50">
                      <div className="text-sm">
                        {selectedTags.length > 0 ? (
                          <>
                            <div className="mb-2">
                              No chats found with the selected tags.
                            </div>
                            <div className="text-xs">
                              Try selecting different tags or clearing the
                              filter.
                            </div>
                          </>
                        ) : (
                          "No chats available."
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <GroupedChatsList
                    groupedChats={groupedChats}
                    currentChatId={Array.isArray(id) ? id[0] : id}
                    onDelete={openDeleteDialog}
                    setOpenMobile={setOpenMobile}
                    allChatTags={allChatTags}
                    onChatTagsUpdate={(chatId, newTags) => {
                      // Update the SWR cache immediately for instant UI update
                      mutateChatTags((currentData) => {
                        if (!currentData) return currentData;
                        return {
                          ...currentData,
                          [chatId]: newTags,
                        };
                      }, false); // Don't revalidate immediately
                    }}
                  />
                );
              })()}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
          />

          {hasReachedEnd ? (
            <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 mt-8">
              You have reached the end of your chat history.
            </div>
          ) : (
            <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center mt-8">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading Chats...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <DeleteDialog />
    </>
  );
}

function GroupedChatsList({
  groupedChats,
  currentChatId,
  onDelete,
  setOpenMobile,
  allChatTags,
  onChatTagsUpdate,
}: {
  groupedChats: GroupedChats;
  currentChatId: string | undefined;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  allChatTags: Record<string, Array<Tag>> | undefined;
  onChatTagsUpdate: (chatId: string, newTags: Array<Tag>) => void;
}) {
  const renderChatSection = (chats: Chat[], title: string) => {
    if (chats.length === 0) return null;

    return (
      <div>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          {title}
        </div>
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === currentChatId}
            onDelete={onDelete}
            setOpenMobile={setOpenMobile}
            tags={allChatTags?.[chat.id] || []}
            onTagsUpdate={(newTags) => onChatTagsUpdate(chat.id, newTags)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {renderChatSection(groupedChats.today, "Today")}
      {renderChatSection(groupedChats.yesterday, "Yesterday")}
      {renderChatSection(groupedChats.lastWeek, "Last 7 days")}
      {renderChatSection(groupedChats.lastMonth, "Last 30 days")}
      {renderChatSection(groupedChats.older, "Older than last month")}
    </div>
  );
}
