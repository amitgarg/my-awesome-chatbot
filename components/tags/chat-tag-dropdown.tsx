"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { PlusIcon } from "../icons";
import { TagMultiSelectDialog } from "./tag-multi-select-dialog";
import { Tag } from "@/app/(chat)/types";

interface ChatTagDropdownProps {
  chatId: string;
  tags: Array<Tag>;
  onTagsUpdate: (newTags: Array<Tag>) => void;
}

export function ChatTagDropdown({
  chatId,
  tags,
  onTagsUpdate,
}: ChatTagDropdownProps) {
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && tagsDropdownOpen) {
        setTagsDropdownOpen(false);
      }
    };

    if (tagsDropdownOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [tagsDropdownOpen]);

  const handleSave = async (selectedTags: Tag[]) => {
    try {
      // Get tags to add and remove
      const tagsToAdd = selectedTags.filter(
        (tag) => !tags.some((currentTag) => currentTag.id === tag.id)
      );

      const tagsToRemove = tags.filter(
        (currentTag) => !selectedTags.some((tag) => currentTag.id === tag.id)
      );

      // Add new tags
      for (const tag of tagsToAdd) {
        await fetch("/api/chat-tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, tagId: tag.id }),
        });
      }

      // Remove tags
      for (const tag of tagsToRemove) {
        await fetch("/api/chat-tag", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, tagId: tag.id }),
        });
      }

      onTagsUpdate(selectedTags);
      setTagsDropdownOpen(false);
    } catch (error) {
      console.error("Error updating chat tags:", error);
    }
  };

  return (
    <DropdownMenu open={tagsDropdownOpen} onOpenChange={setTagsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors">
          <PlusIcon size={16} />
          <span>Tags</span>
          {tags.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-sidebar-accent text-sidebar-accent-foreground rounded-full">
              {tags.length}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent className="min-w-60 p-4" side="bottom" align="end">
          <TagMultiSelectDialog
            currentTags={tags}
            onChangeTags={handleSave}
            onClose={() => setTagsDropdownOpen(false)}
            dialogTitle="Manage Chat Tags"
          />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
