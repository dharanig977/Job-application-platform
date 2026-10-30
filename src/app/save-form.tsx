"use client";

import { useState, useTransition } from "react";

// A form that calls a server action without React's automatic form reset,
// which otherwise blanks dropdowns after saving even though the values were
// stored. Shows a short "Saved" confirmation.
export function SaveForm({
  action,
  children,
  className,
  footerClassName,
  submitLabel,
  savedLabel = "Saved",
}: {
  action: (form: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  footerClassName?: string;
  submitLabel: string;
  savedLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await action(data);
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 3000);
          } catch {
            setStatus("error");
          }
        });
      }}
    >
      {children}
      <div className={footerClassName}>
        <button
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {submitLabel}
        </button>
        <span role="status" className="ml-3 text-sm" aria-live="polite">
          {pending ? <span className="text-zinc-500">Saving…</span> : null}
          {!pending && status === "saved" ? <span className="text-green-700 dark:text-green-400">{savedLabel} ✓</span> : null}
          {!pending && status === "error" ? <span className="text-red-600">Couldn&apos;t save. Please try again.</span> : null}
        </span>
      </div>
    </form>
  );
}
