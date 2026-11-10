import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { postFeedback } from "../lib/api";
import type { Theme } from "../lib/theme";

export function FeedbackDialog({
  open,
  onClose,
  cityId,
  placeId,
  theme,
  readView,
}: {
  open: boolean;
  onClose: () => void;
  cityId: string | null;
  placeId: string | null;
  theme: Theme;
  readView: () => { lat: number | null; lng: number | null; zoom: number | null };
}) {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await postFeedback({
        message,
        contact,
        context: {
          city: cityId,
          place: placeId,
          ...readView(),
          lang: i18n.resolvedLanguage?.startsWith("vi") ? "vi" : "en",
          theme,
        },
      });
      setDone(true);
      setMessage("");
      setContact("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-3 md:items-center" role="presentation" onClick={onClose}>
      <form
        role="dialog"
        aria-labelledby="feedback-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl bg-cream p-5 text-ink shadow-2xl dark:bg-[#2a211c] dark:text-cream"
      >
        <h2 id="feedback-title" className="font-display text-2xl">
          {t("feedbackTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted dark:text-sand/80">{t("feedbackHint")}</p>
        {done ? <p className="mt-4 text-sm font-semibold text-jungle">{t("sent")}</p> : null}
        <label className="mt-4 block text-sm font-semibold" htmlFor="feedback-message">
          {t("message")}
        </label>
        <textarea
          id="feedback-message"
          required
          minLength={2}
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 h-28 w-full resize-none rounded-2xl border border-sand bg-white/70 px-3 py-2 text-sm outline-none focus:border-lantern dark:border-white/10 dark:bg-black/20"
        />
        <label className="mt-3 block text-sm font-semibold" htmlFor="feedback-contact">
          {t("contact")}
        </label>
        <input
          id="feedback-contact"
          maxLength={200}
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-sand bg-white/70 px-3 py-2 text-sm outline-none focus:border-lantern dark:border-white/10 dark:bg-black/20"
        />
        {error ? <p className="mt-2 text-sm text-lotus">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold">
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-lantern px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
          >
            {t("send")}
          </button>
        </div>
      </form>
    </div>
  );
}
