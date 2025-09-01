// In SidebarHistory or a new component above it

import useSWR, { KeyedMutator } from "swr";
import { useState } from "react";
import { fetcher } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
} from "../ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { TagMultiSelectDialog } from "./tag-multi-select-dialog";
import { Tag as TagType } from "@/app/(chat)/types";
import { TrashIcon } from "../icons";
import { Badge } from "../ui/badge";
import { toast } from "@/components/toast";

interface Tag {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

interface TagManagerProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  user: { id: string } | null;
  onTagsDeleted?: () => void; // Callback to refetch chat tags cache
}

export default function TagManager({
  selectedTags,
  setSelectedTags,
  user,
  onTagsDeleted,
}: TagManagerProps) {
  const swrKey = user ? "/api/tag" : null;

  const {
    data: tags,
    error,
    mutate,
    isLoading,
  } = useSWR<Tag[]>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // Cache for 5 minutes
  });
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);

  const handleDeleteTags = async (tagsToDelete: TagType[]) => {
    if (!tagsToDelete.length) return;

    try {
      // Delete each tag via API
      const deletePromises = tagsToDelete.map(async (tag) => {
        const response = await fetch(`/api/tag/${tag.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to delete tag: ${tag.name}`
          );
        }

        return tag.id;
      });

      // Wait for all deletions to complete
      const deletedTagIds = await Promise.all(deletePromises);

      // Optimistically update the cache by removing deleted tags
      await mutate(
        (currentTags) => {
          if (!currentTags) return currentTags;
          return currentTags.filter((tag) => !deletedTagIds.includes(tag.id));
        },
        {
          revalidate: false, // Don't revalidate immediately
        }
      );

      // Remove deleted tags from selected tags if they were selected
      const updatedSelectedTags = selectedTags.filter(
        (tagId: string) => !deletedTagIds.includes(tagId)
      );
      setSelectedTags(updatedSelectedTags);

      // Force refetch chat tags cache
      if (onTagsDeleted) {
        onTagsDeleted();
      }

      console.log(`Successfully deleted ${deletedTagIds.length} tags`);
    } catch (error) {
      console.error("Error deleting tags:", error);

      // Show error toast with user-friendly message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete tags. Please try again.";

      toast({
        type: "error",
        description: errorMessage,
      });

      // Revalidate to get the latest data if there was an error
      await mutate();
    } finally {
      setTagsDropdownOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <div className="text-sm text-gray-500">Loading tags...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <div className="text-sm text-red-500">
          Failed to load tags. Please refresh.
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          className="text-sm text-blue-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">Tags</div>
        <DeleteTagsMenu
          handleDeleteTags={handleDeleteTags}
          setTagsDropdownOpen={setTagsDropdownOpen}
          tagsDropdownOpen={tagsDropdownOpen}
        />
      </div>
      <TagInput user={user} onTagCreated={mutate} />
      <TagSelection
        tags={tags || []}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />
    </div>
  );
}

// TagInput component
function TagInput({
  user,
  onTagCreated,
}: {
  user: { id: string } | null;
  onTagCreated: KeyedMutator<Tag[]>;
}) {
  const [newTag, setNewTag] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const createTag = async () => {
    if (!newTag.trim() || !user?.id) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/tag", {
        method: "POST",
        body: JSON.stringify({ name: newTag.trim() }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create tag");
      }

      const newTagData = await response.json();

      // Optimistically update the cache
      await onTagCreated(
        (currentTags) => {
          if (!currentTags) return [newTagData];
          if (currentTags.find((tag) => tag.name === newTagData.name))
            return currentTags;
          return [...currentTags, newTagData].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        },
        {
          revalidate: false, // Don't revalidate immediately
        }
      );

      setNewTag("");
    } catch (error) {
      console.error("Error creating tag:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create tag. Please try again.";
      toast({
        type: "error",
        description: errorMessage,
      });
      // Revalidate to get the latest data if there was an error
      await onTagCreated();
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating) {
      createTag();
    }
  };
  return (
    <div className="relative flex-1">
      <input
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter tag name"
        className="border px-2 py-1 rounded text-sm w-full pr-8"
        disabled={isCreating}
      />
      {isCreating && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}

// Tag Selection Component
function TagSelection({
  tags,
  selectedTags,
  setSelectedTags,
}: {
  tags: Tag[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}) {
  const handleTagClick = (tagId: string) => {
    setSelectedTags(
      selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId]
    );
  };
  if (tags.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No tags yet. Create your first tag below.
      </div>
    );
  }

  return (
    <div className="flex gap-1 flex-wrap text-xs">
      {tags.map((tag) => (
        <button
          type="button"
          key={tag.id}
          onClick={() => handleTagClick(tag.id)}
        >
          <Badge
            key={tag.id}
            variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
          >
            {tag.name}
          </Badge>
        </button>
      ))}
    </div>
  );
}

interface DeleteTagsMenuProps {
  handleDeleteTags: (tags: TagType[]) => void;
  setTagsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tagsDropdownOpen: boolean;
}

function DeleteTagsMenu({
  handleDeleteTags,
  setTagsDropdownOpen,
  tagsDropdownOpen,
}: DeleteTagsMenuProps) {
  return (
    <DropdownMenu open={tagsDropdownOpen} onOpenChange={setTagsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Delete tag"
        >
          <TrashIcon size={12} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent className="min-w-40 p-4" side="bottom" align="end">
          <TagMultiSelectDialog
            currentTags={[]}
            onChangeTags={handleDeleteTags}
            onClose={() => setTagsDropdownOpen(false)}
            actionButtonText="Delete"
            dialogTitle="Delete Tags"
          />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
