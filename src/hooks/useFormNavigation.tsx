// src/hooks/useFormNavigation.ts
import { useEffect } from "react";

export const useFormNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Only apply inside inputs, selects, textareas, and buttons
      if (!["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;

      const form = target.closest("form");
      if (!form) return;

      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          "input, select, textarea, button, [tabindex]:not([tabindex='-1'])"
        )
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          !el.getAttribute("aria-hidden") &&
          el.offsetParent !== null // skip hidden elements
      );

      const index = focusable.indexOf(target);

      // -----------------------------
      // Handle Enter Key
      // -----------------------------
      if (e.key === "Enter") {
        e.preventDefault();

        // ✅ Special case: File input
        if (
          target.tagName === "INPUT" &&
          (target as HTMLInputElement).type === "file"
        ) {
          const fileInput = target as HTMLInputElement;
          fileInput.click(); // open file picker

          // 🔥 After file selection, move focus to submit button
          const submitButton = form.querySelector(
            "button[type='submit']"
          ) as HTMLButtonElement | null;

          if (submitButton) {
            const handleChange = () => {
              submitButton.focus();
              fileInput.removeEventListener("change", handleChange);
            };
            fileInput.addEventListener("change", handleChange);
          }

          return;
        }

        const next = focusable[index + 1];

        // If next element exists → move focus
        if (next) {
          next.focus();
        } else {
          // No next element → check if current is button
          if (target.tagName === "BUTTON") {
            (target as HTMLButtonElement).click(); // trigger submit/click
          } else {
            // fallback: find first button in form
            const button = focusable.find(
              (el) => el.tagName === "BUTTON"
            ) as HTMLButtonElement | undefined;
            if (button) button.focus();
          }
        }
      }

      // -----------------------------
      // Handle Arrow Down/Right
      // -----------------------------
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = focusable[index + 1];
        if (next) next.focus();
      }

      // -----------------------------
      // Handle Arrow Up/Left
      // -----------------------------
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = focusable[index - 1];
        if (prev) prev.focus();
      }

      // -----------------------------
      // Handle Escape → focus Cancel button
      // -----------------------------
      if (e.key === "Escape") {
        e.preventDefault();
        const cancelButton = Array.from(form.querySelectorAll("button")).find(
          (btn) =>
            btn.textContent?.trim().toLowerCase() === "cancel" ||
            btn.getAttribute("data-role") === "cancel"
        ) as HTMLButtonElement | undefined;

        if (cancelButton) cancelButton.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
};
