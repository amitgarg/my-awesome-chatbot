"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Tag } from "@/app/(chat)/types";

interface TagMultiSelectDialogProps {
  currentTags: Array<Tag>;
  onChangeTags: (selectedTags: Tag[]) => void;
  onClose: () => void;
  actionButtonText?: string;
  dialogTitle?: string;
}

// Tag Multi-Select Component - Focused only on selection
export function TagMultiSelectDialog({
  currentTags = [],
  onChangeTags,
  onClose,
  dialogTitle = "Manage Tags",
  actionButtonText = "Save",
}: TagMultiSelectDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    currentTags.map((tag) => tag.id)
  );
  const [isActionRunning, setIsActionRunning] = useState(false);

  // Fetch all available tags for the user (uses shared cache with TagManager)
  const { data: allTags } = useSWR<Array<{ id: string; name: string }>>(
    "/api/tag",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
    }
  );

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleChangeTags = () => {
    setIsActionRunning(true);
    if (!allTags) return;
    const selectedTagObjects = allTags.filter((tag) =>
      selectedTags.includes(tag.id)
    );
    onChangeTags(selectedTagObjects);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{dialogTitle}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close tag selection"
        >
          ✕
        </button>
      </div>

      <SelectedTags allTags={allTags} selectedTags={selectedTags} />

      <TagsFilterAndSelect
        tags={allTags}
        handleTagToggle={handleTagToggle}
        selectedTags={selectedTags}
      />

      <div className="pt-2 border-t">
        <button
          type="button"
          onClick={handleChangeTags}
          disabled={isActionRunning}
          className="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
        >
          {actionButtonText}
        </button>
      </div>
    </div>
  );
}

interface SelectedTagsProps {
  allTags: Tag[] | undefined;
  selectedTags: string[];
}

function SelectedTags({ allTags, selectedTags }: SelectedTagsProps) {
  if (!allTags || selectedTags.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {allTags
        ?.filter((tag) => selectedTags.includes(tag.id))
        .map((tag) => (
          <Badge key={tag.id} variant="default">
            {tag.name}
          </Badge>
        ))}
    </div>
  );
}

interface TagsFilterAndSelectProps {
  tags: Tag[] | undefined;
  handleTagToggle: (tagId: string) => void;
  selectedTags: string[];
}

function TagsFilterAndSelect({
  tags,
  handleTagToggle,
  selectedTags,
}: TagsFilterAndSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredTags =
    tags?.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  const handleKeyDown = (e: React.KeyboardEvent, tagId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTagToggle(tagId);
    }
  };

  if (!tags) {
    return (
      <span className="ml-2 text-sm text-muted-foreground">
        Loading tags...
      </span>
    );
  }
  return (
    <>
      <input
        id="tag-search"
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Type to filter tags..."
        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        aria-label="Search tags"
        autoComplete="off"
        tabIndex={0}
      />
      <div
        className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2"
        role="listbox"
        aria-label="Available tags"
      >
        {filteredTags.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No tags available
          </div>
        ) : (
          filteredTags.map((tag) => {
            const inputId = `tag-${tag.id}`;
            const isSelected = selectedTags.includes(tag.id);

            return (
              <div
                key={tag.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded text-sm transition-colors focus:bg-muted focus:ring-2 focus:ring-primary focus:ring-inset focus:outline-none"
                role="option"
                aria-selected={isSelected}
                onKeyDown={(e) => handleKeyDown(e, tag.id)}
                onClick={() => handleTagToggle(tag.id)}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleTagToggle(tag.id)}
                  className="rounded border-gray-300"
                  aria-label={`Select ${tag.name} tag`}
                  tabIndex={0}
                />
                <label
                  htmlFor={inputId}
                  className="flex-1 cursor-pointer select-none"
                >
                  {tag.name}
                </label>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
