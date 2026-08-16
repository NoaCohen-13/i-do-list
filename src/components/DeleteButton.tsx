"use client";

export function DeleteButton({
  action,
  confirmMessage,
  label,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="cursor-pointer text-berry hover:text-red-600"
        aria-label={label}
      >
        ✕
      </button>
    </form>
  );
}
