"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpRight, Check, Loader2, MessageCircle, Phone } from "lucide-react";
import { captureAttribution } from "@/lib/attribution";
import {
  INTEREST_OPTIONS,
  LEAD_LIMITS,
  validateComment,
  validateInterest,
  validateLeadForm,
  validateName,
  validatePhone,
  type Interest,
  type LeadErrorResponse,
  type LeadFieldErrors,
  type LeadResponse,
  type LeadSuccessResponse,
} from "@/lib/lead-schema";
import {
  BY_PHONE_HINT,
  BY_PHONE_PLACEHOLDER,
  extractNationalDigits,
  formatByPhone,
  normalizeByPhone,
} from "@/lib/phone";
import { LEAD_PREFILL_EVENT, type LeadPrefillDetail } from "@/lib/lead-events";
import { site } from "@/lib/site";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string; duplicate: boolean; id: string }
  | { status: "error"; message: string; retryable: boolean };

const REQUEST_TIMEOUT_MS = 15_000;

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function firstErrorField(errors: LeadFieldErrors): keyof LeadFieldErrors | null {
  const order: Array<keyof LeadFieldErrors> = ["name", "phone", "interest", "comment"];
  return order.find((field) => errors[field]) ?? null;
}

export function LeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<Interest>("subscription");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const requestIdRef = useRef<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const isSubmitting = submitState.status === "submitting";

  const clearFieldError = useCallback((field: keyof LeadFieldErrors) => {
    setFieldErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  const focusField = useCallback((field: keyof LeadFieldErrors) => {
    const map = { name: nameRef, phone: phoneRef, comment: commentRef } as const;
    if (field === "name" || field === "phone" || field === "comment") {
      map[field].current?.focus();
    }
  }, []);

  // Пресет из каталога или блока подписки.
  useEffect(() => {
    const onPrefill = (event: Event) => {
      const detail = (event as CustomEvent<LeadPrefillDetail>).detail;
      if (!detail) {
        return;
      }

      if (detail.interest) {
        setInterest(detail.interest);
        clearFieldError("interest");
      }

      if (typeof detail.comment === "string" && detail.comment.length > 0) {
        setComment(detail.comment.slice(0, LEAD_LIMITS.commentMax));
        clearFieldError("comment");
      }

      // Если форма уже была успешно отправлена — возвращаем её к жизни.
      setSubmitState((current) => (current.status === "success" ? { status: "idle" } : current));
      window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 450);
    };

    window.addEventListener(LEAD_PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(LEAD_PREFILL_EVENT, onPrefill);
  }, [clearFieldError]);

  // Фокус на заголовке после успешной отправки — для скринридеров.
  useEffect(() => {
    if (submitState.status === "success") {
      successHeadingRef.current?.focus({ preventScroll: true });
    }
  }, [submitState.status]);

  const handlePhoneInput = (value: string) => {
    setPhone(formatByPhone(value));
    clearFieldError("phone");

    const input = phoneRef.current;
    if (input) {
      const caret = formatByPhone(value).length;
      window.requestAnimationFrame(() => {
        input.setSelectionRange(caret, caret);
      });
    }
  };

  const handlePhoneKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace") {
      return;
    }

    const input = event.currentTarget;
    const isCaretAtEnd = input.selectionStart === input.selectionEnd && input.selectionStart === phone.length;

    if (!isCaretAtEnd || phone.length === 0) {
      return;
    }

    const lastChar = phone.charAt(phone.length - 1);
    if (/\d/.test(lastChar)) {
      return;
    }

    // Backspace на разделителе маски — удаляем последнюю цифру, а не скобку.
    event.preventDefault();
    setPhone(formatByPhone(extractNationalDigits(phone).slice(0, -1)));
    clearFieldError("phone");
  };

  const validateSingle = (field: keyof LeadFieldErrors) => {
    let error: string | null = null;

    if (field === "name") {
      error = validateName(name);
    } else if (field === "phone") {
      error = validatePhone(phone);
    } else if (field === "interest") {
      error = validateInterest(interest);
    } else if (field === "comment") {
      error = validateComment(comment);
    }

    setFieldErrors((previous) => {
      const next = { ...previous };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setInterest("subscription");
    setComment("");
    setHoneypot("");
    setFieldErrors({});
    setSubmitState({ status: "idle" });
    requestIdRef.current = null;
    window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 50);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const errors = validateLeadForm({ name, phone, interest, comment });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const first = firstErrorField(errors);
      if (first) {
        focusField(first);
      }
      return;
    }

    if (requestIdRef.current === null) {
      requestIdRef.current = createRequestId();
    }

    setSubmitState({ status: "submitting" });

    // Атрибуцию читаем в момент отправки: UTM/referrer/страница + first-touch
    // из sessionStorage. Так не нужен ни эффект, ни hydration-состояние.
    const attribution = captureAttribution();

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          // Отправляем канонический E.164: сервер всё равно перепроверит формат.
          phone: normalizeByPhone(phone) ?? phone,
          interest,
          comment,
          attribution,
          requestId: requestIdRef.current,
          contactWebsite: honeypot,
        }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as LeadResponse | null;

      if (!payload) {
        setSubmitState({
          status: "error",
          retryable: true,
          message: "Сервер ответил неожиданно. Попробуйте ещё раз или позвоните нам — так точно быстрее.",
        });
        return;
      }

      if (response.ok && payload.ok) {
        const success = payload as LeadSuccessResponse;
        setSubmitState({
          status: "success",
          message: success.message,
          duplicate: success.duplicate,
          id: success.id,
        });
        return;
      }

      const failure = payload as LeadErrorResponse;

      if (failure.error === "validation" && failure.fieldErrors) {
        setFieldErrors(failure.fieldErrors);
        const first = firstErrorField(failure.fieldErrors);
        if (first) {
          focusField(first);
        }
        setSubmitState({ status: "error", retryable: true, message: failure.message });
        return;
      }

      setSubmitState({
        status: "error",
        retryable: failure.error !== "rate_limited",
        message:
          failure.error === "rate_limited"
            ? failure.message
            : failure.message ||
              "Не получилось отправить заявку. Попробуйте ещё раз или позвоните нам.",
      });
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      setSubmitState({
        status: "error",
        retryable: true,
        message: aborted
          ? "Слишком долго ждём ответ. Проверьте связь и попробуйте ещё раз — или позвоните нам."
          : "Не получилось отправить заявку. Проверьте связь или позвоните нам — так точно быстрее.",
      });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  if (submitState.status === "success") {
    return (
      <div className="paper-card p-6 sm:p-8" role="status" aria-live="polite">
        <div className="flex flex-wrap items-center gap-3">
          <span className="stamp">заявка принята</span>
          {submitState.duplicate ? null : (
            <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-mute uppercase">
              № {submitState.id}
            </span>
          )}
        </div>

        <h3
          ref={successHeadingRef}
          tabIndex={-1}
          className="display-3 mt-5 outline-none"
        >
          {submitState.duplicate ? "Заявка уже у нас" : "Спасибо! Заявка у нас."}
        </h3>

        <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-soft">
          {submitState.duplicate
            ? "Похоже, вы уже отправляли заявку с этого номера в последние десять минут — мы её получили. Не дублируем, чтобы не запутаться."
            : "Менеджер перезвонит с 10 до 20 по Минску: уточнит сорта, помол и удобное время доставки."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={site.contacts.phoneHref} className="btn btn-primary">
            <Phone aria-hidden="true" size={17} strokeWidth={1.75} />
            {site.contacts.phoneDisplay}
          </a>
          <button type="button" className="btn btn-outline" onClick={resetForm}>
            Отправить ещё одну
          </button>
        </div>

        <p className="mt-5 flex items-start gap-2 border-t border-rule pt-4 text-xs leading-relaxed text-ink-mute">
          <MessageCircle aria-hidden="true" className="mt-0.5 shrink-0" size={15} strokeWidth={1.75} />
          <span>
            Неудобно ждать звонка? Напишите в Telegram{" "}
            <a
              href={site.contacts.telegram}
              target="_blank"
              rel="noreferrer"
              className="link-underline font-semibold text-ink"
            >
              {site.contacts.telegramLabel}
            </a>{" "}
            — ответим быстрее.
          </span>
        </p>
      </div>
    );
  }

  return (
    <form className="paper-card p-5 sm:p-7" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
            что вас интересует
          </p>
          <p className="mt-1 text-sm text-ink-mute">Выберите вариант — остальное подскажем.</p>
        </div>
        <span className="stamp stamp--ink">ответим в течение дня</span>
      </div>

      <div
        className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
        role="group"
        aria-label="Что вас интересует"
      >
        {INTEREST_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="interest-tab"
            aria-pressed={interest === option.value}
            onClick={() => {
              setInterest(option.value);
              clearFieldError("interest");
            }}
          >
            {interest === option.value ? (
              <Check aria-hidden="true" size={14} strokeWidth={2.25} />
            ) : null}
            {option.label}
          </button>
        ))}
      </div>
      <p className="field-hint mt-2" aria-live="polite">
        {INTEREST_OPTIONS.find((option) => option.value === interest)?.hint}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="lead-name">
            Имя
          </label>
          <input
            ref={nameRef}
            id="lead-name"
            name="name"
            type="text"
            className="field-input"
            placeholder="Как к вам обращаться"
            autoComplete="name"
            maxLength={LEAD_LIMITS.nameMax + 10}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError("name");
            }}
            onBlur={() => validateSingle("name")}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "lead-name-error" : undefined}
            disabled={isSubmitting}
          />
          {fieldErrors.name ? (
            <p id="lead-name-error" className="field-error" role="alert">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="lead-phone">
            Телефон
          </label>
          <input
            ref={phoneRef}
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            className="field-input tabular-nums"
            placeholder={BY_PHONE_PLACEHOLDER}
            autoComplete="tel"
            value={phone}
            onChange={(event) => handlePhoneInput(event.target.value)}
            onKeyDown={handlePhoneKeyDown}
            onBlur={() => validateSingle("phone")}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "lead-phone-error" : "lead-phone-hint"}
            disabled={isSubmitting}
          />
          {fieldErrors.phone ? (
            <p id="lead-phone-error" className="field-error" role="alert">
              {fieldErrors.phone}
            </p>
          ) : (
            <p id="lead-phone-hint" className="field-hint">
              {BY_PHONE_HINT}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="field-label" htmlFor="lead-comment">
          Комментарий <span className="font-normal text-ink-mute">(необязательно)</span>
        </label>
        <textarea
          ref={commentRef}
          id="lead-comment"
          name="comment"
          rows={3}
          className="field-input field-textarea"
          placeholder="Например: люблю светлую обжарку, нужен помол под воронку, удобно после 18:00"
          maxLength={LEAD_LIMITS.commentMax + 40}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            clearFieldError("comment");
          }}
          onBlur={() => validateSingle("comment")}
          aria-invalid={Boolean(fieldErrors.comment)}
          aria-describedby={fieldErrors.comment ? "lead-comment-error" : "lead-comment-hint"}
          disabled={isSubmitting}
        />
        <div className="flex items-start justify-between gap-4">
          {fieldErrors.comment ? (
            <p id="lead-comment-error" className="field-error" role="alert">
              {fieldErrors.comment}
            </p>
          ) : (
            <p id="lead-comment-hint" className="field-hint">
              Чем больше деталей — тем точнее подберём.
            </p>
          )}
          <p className="field-hint shrink-0 tabular-nums">
            {comment.length}/{LEAD_LIMITS.commentMax}
          </p>
        </div>
      </div>

      {/* Honeypot: люди это поле не видят, боты заполняют — заявку тихо отбрасываем. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="lead-contact-website">Не заполняйте</label>
        <input
          id="lead-contact-website"
          name="contactWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {submitState.status === "error" ? (
        <div className="mt-5 border border-error/40 bg-[#fdf6f2] p-4 text-sm leading-relaxed text-error" role="alert">
          <p className="font-semibold">{submitState.message}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={site.contacts.phoneHref} className="link-underline font-semibold">
              Позвонить: {site.contacts.phoneDisplay}
            </a>
            <a
              href={site.contacts.telegram}
              target="_blank"
              rel="noreferrer"
              className="link-underline font-semibold"
            >
              Написать в Telegram
            </a>
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[23rem] text-[0.72rem] leading-relaxed text-ink-mute">
          Отправляя заявку, вы соглашаетесь на обработку персональных данных. Используем их только
          чтобы связаться по этой заявке.
        </p>
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin" size={17} strokeWidth={2} />
              Отправляем…
            </>
          ) : (
            <>
              Отправить заявку
              <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.75} />
            </>
          )}
        </button>
      </div>

      {submitState.status === "submitting" ? (
        <p className="field-hint mt-3" aria-live="polite">
          Отправляем заявку. Обычно это занимает пару секунд.
        </p>
      ) : null}
    </form>
  );
}
