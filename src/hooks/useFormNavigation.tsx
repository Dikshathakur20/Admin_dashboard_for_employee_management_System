import { useEffect } from "react";

export const useFormNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Only apply inside inputs, selects, textareas, buttons
      if (!["INPUT", "SELECT", "TEXTAREA", "BUTTON", "DIV"].includes(target.tagName)) return;

      const form = target.closest("form");
      if (!form) return;

      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          "input, select, textarea, button, [tabindex]:not([tabindex='-1']), [role='button']"
        )
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          !el.getAttribute("aria-hidden") &&
          el.offsetParent !== null
      );

      const index = focusable.indexOf(target);

      // -----------------------------
      // Handle Enter Key
      // -----------------------------
      if (e.key === "Enter") {
        e.preventDefault();

        // Special case: File input
        if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "file") {
          const fileInput = target as HTMLInputElement;
          fileInput.click();
          const submitButton = form.querySelector("button[type='submit']") as HTMLButtonElement | null;
          if (submitButton) {
            const handleChange = () => {
              submitButton.focus();
              fileInput.removeEventListener("change", handleChange);
            };
            fileInput.addEventListener("change", handleChange);
          }
          return;
        }

        // Special case: Custom SelectTrigger
        if (target.getAttribute("role") === "button") {
          // Move to next focusable element instead of opening dropdown
          const next = focusable[index + 1];
          if (next) {
            next.focus();
          }
          return;
        }

        // Regular inputs/buttons
        const next = focusable[index + 1];
        if (next) {
          next.focus();
        } else {
          const submitButton = Array.from(form.querySelectorAll("button")).find(
            (btn) => btn.type === "submit" || btn.getAttribute("data-role") === "submit"
          ) as HTMLButtonElement | undefined;
          if (submitButton) submitButton.focus();
        }
      }

      // -----------------------------
      // Arrow keys navigation
      // -----------------------------
      if (["ArrowDown", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const next = focusable[index + 1];
        if (next) next.focus();
      }

      if (["ArrowUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        const prev = focusable[index - 1];
        if (prev) prev.focus();
      }

      // -----------------------------
      // Escape → focus Cancel
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
