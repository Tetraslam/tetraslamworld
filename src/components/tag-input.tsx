"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface TagInputProps {
  tags: string[];
  allTags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, allTags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!input.trim()) return allTags.filter((t) => !tags.includes(t));
    const lower = input.toLowerCase();
    return allTags.filter(
      (t) => t.toLowerCase().includes(lower) && !tags.includes(t),
    );
  }, [input, allTags, tags]);

  // Check if current input is a new tag (not in allTags)
  const isNewTag =
    input.trim() &&
    !allTags.includes(input.trim().toLowerCase()) &&
    !tags.includes(input.trim().toLowerCase());

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        addTag(suggestions[highlightedIndex]);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === ",") {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      }
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (showSuggestions && dropdownRef.current) {
      const highlighted = dropdownRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`,
      );
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, showSuggestions]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 bg-background border border-border rounded focus-within:border-rose/50 min-h-[42px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 bg-rose/10 text-rose text-sm rounded border border-rose/30"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-rose-deep"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "type to add tags..." : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || isNewTag) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-surface border border-border rounded shadow-lg max-h-48 overflow-y-auto"
        >
          {isNewTag && (
            <button
              type="button"
              onClick={() => addTag(input)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-rose/10 flex items-center gap-2"
            >
              <span className="text-rose">+</span>
              <span>create &quot;{input.trim()}&quot;</span>
            </button>
          )}
          {suggestions.map((tag, index) => (
            <button
              key={tag}
              type="button"
              data-index={index}
              onClick={() => addTag(tag)}
              className={`w-full px-3 py-2 text-left text-sm ${
                index === highlightedIndex
                  ? "bg-rose/10 text-rose"
                  : "hover:bg-rose/5"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground/60 mt-1">
        press enter or comma to add, backspace to remove
      </p>
    </div>
  );
}
