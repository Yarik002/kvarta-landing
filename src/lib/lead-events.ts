/**
 * Мост между каталогом/подпиской и формой заявки.
 *
 * Секции живут в разных client-островах, поэтому передаём пресет
 * через CustomEvent и скроллим к форме. Для пользователя это выглядит
 * так: нажал «Заказать» у сорта — форма уже открыта и знает, о чём речь.
 */

import type { Interest } from "@/lib/lead-schema";

export const LEAD_PREFILL_EVENT = "kvarta:lead-prefill";

export interface LeadPrefillDetail {
  interest?: Interest;
  comment?: string;
}

export function dispatchLeadPrefill(detail: LeadPrefillDetail): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<LeadPrefillDetail>(LEAD_PREFILL_EVENT, { detail }));
}

export function scrollToLeadForm(): void {
  if (typeof window === "undefined") {
    return;
  }

  document.getElementById("lead")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function orderLeadPrefill(interest: Interest, comment: string): void {
  dispatchLeadPrefill({ interest, comment });
  scrollToLeadForm();
}
