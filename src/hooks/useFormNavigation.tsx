// src/hooks/useFormNavigation.ts
import { useEffect } from "react";

export const useFormNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Only apply inside inputs, selects, textareas
      if (!["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;

      const form = target.closest("form");
      if (!form) return;

      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          "input, select, textarea, button, [tabindex]:not([tabindex='-1'])"
        )
      ).filter(el => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));

      const index = focusable.indexOf(target);

      // Handle Enter → Move to next field
      if (e.key === "Enter") {
        e.preventDefault();
        const next = focusable[index + 1];
        if (next) {
          next.focus();
        }
      }

      // Handle Arrow Down/Right → Next
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = focusable[index + 1];
        if (next) next.focus();
      }

      // Handle Arrow Up/Left → Previous
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = focusable[index - 1];
        if (prev) prev.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
};
