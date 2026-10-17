"use client";

import type { ReactNode } from "react";
import type { Interest } from "@/lib/lead-schema";
import { orderLeadPrefill } from "@/lib/lead-events";

interface PrefillButtonProps {
  interest: Interest;
  comment?: string;
  className?: string;
  children: ReactNode;
  /** Дополнительный aria-label, если текст кнопки короткий. */
  ariaLabel?: string;
}

/**
 * Кнопка в server-секции, которая открывает форму с готовым пресетом.
 * Единственный client-компонент в иначе статичных блоках.
 */
export function PrefillButton({ interest, comment = "", className, children, ariaLabel }: PrefillButtonProps) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => orderLeadPrefill(interest, comment)}
    >
      {children}
    </button>
  );
}
