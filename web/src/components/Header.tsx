import { useTranslation } from "react-i18next";
import type { Theme } from "../lib/theme";

export function Header({
  theme,
  onTheme,
  onFeedback,
  onHome,
}: {
  theme: Theme;
  onTheme: () => void;
  onFeedback: () => void;
  onHome: () => void;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith("vi") ? "vi" : "en";

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-2 border-b border-sand/80 bg-cream/85 px-3 backdrop-blur-md md:gap-4 md:px-5 dark:border-white/10 dark:bg-[#1a1410]/85">
      <button type="button" onClick={onHome} className="min-w-0 shrink text-left">
        <span className="font-display block truncate text-[1.15rem] leading-none tracking-tight text-ink sm:text-[1.45rem] md:text-[1.7rem] dark:text-cream">
          <span className="text-lantern italic">the</span>HaofTravelo
        </span>
        <span className="mt-1 hidden text-xs tracking-wide text-muted md:block dark:text-sand/80">{t("tagline")}</span>
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
        <div className="flex rounded-full bg-sand/80 p-0.5 md:p-1 dark:bg-white/10" role="group" aria-label={t("language")}>
          {(["vi", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => void i18n.changeLanguage(code)}
              className={`rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide uppercase md:px-2.5 md:text-xs ${
                language === code ? "bg-ink text-cream dark:bg-amberglow dark:text-ink" : "text-muted dark:text-sand"
              }`}
              aria-pressed={language === code}
            >
              {code}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onTheme}
          aria-label={t("theme")}
          className="rounded-full border border-sand px-2 py-1 text-[11px] font-semibold text-ink md:px-3 md:py-1.5 md:text-xs dark:border-white/15 dark:text-cream"
        >
          {theme === "dark" ? t("themeLight") : t("themeDark")}
        </button>
        <button
          type="button"
          onClick={onFeedback}
          className="rounded-full bg-lantern px-2 py-1 text-[11px] font-semibold text-ink md:px-3 md:py-1.5 md:text-xs"
        >
          {t("feedback")}
        </button>
      </div>
    </header>
  );
}
