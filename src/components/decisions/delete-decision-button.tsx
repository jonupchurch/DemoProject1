"use client";

import { useState } from "react";
import { deleteDecision } from "@/actions/decisions";

export function DeleteDecisionButton({ decisionId }: { decisionId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      "Delete this decision permanently? This cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    await deleteDecision(decisionId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDeleting}
      className="text-sm text-verdict-wrong underline disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete decision"}
    </button>
  );
}
