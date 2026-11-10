import { isAlwaysOpen } from "@shared/openingHours";
import type { Place } from "@shared/places";
import { CATEGORIES, SEARCH_COLOR } from "@shared/categories";
import { useTranslation } from "react-i18next";
import { directionsUrl, placeTitle, sharePlace, telHref } from "../lib/format";

function colorFor(category: string): string {
  return CATEGORIES.find((item) => item.id === category)?.color ?? SEARCH_COLOR;
}

export function PlaceCard({
  place,
  cityId,
  onShared,
}: {
  place: Place;
  cityId: string | null;
  onShared: (kind: "shared" | "copied") => void;
}) {
  const { t, i18n } = useTranslation();
  const title = placeTitle(place, i18n.language, t("unnamed"));
  const badge = place.category === "hospitals" && isAlwaysOpen(place.opening_hours);

  return (
    <article className="max-w-[260px]">
      <div className="flex items-start gap-2 pr-5">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorFor(place.category) }} />
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight">{title}</h3>
          <p className="text-xs tracking-wide text-muted uppercase dark:text-sand/70">
            {t(`categories.${place.category}`)}
            {badge ? <span className="ml-2 rounded-full bg-lotus/20 px-1.5 py-0.5 text-[10px] font-bold text-lotus">{t("alwaysOpen")}</span> : null}
          </p>
        </div>
      </div>
      {place.opening_hours ? (
        <p className="mt-2 text-sm leading-snug">
          <span className="text-muted dark:text-sand/70">{t("hours")}: </span>
          {place.opening_hours}
        </p>
      ) : null}
      {place.phone ? (
        <p className="mt-1 text-sm">
          <span className="text-muted dark:text-sand/70">{t("phone")}: </span>
          {place.phone}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <a
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream dark:bg-amberglow dark:text-ink"
          href={directionsUrl(place.lat, place.lng)}
          target="_blank"
          rel="noreferrer"
        >
          {t("directions")}
        </a>
        <button
          type="button"
          className="rounded-full border border-sand px-3 py-1.5 text-xs font-semibold dark:border-white/15"
          onClick={() => {
            void sharePlace(title, cityId, place.id)
              .then(onShared)
              .catch(() => undefined);
          }}
        >
          {t("share")}
        </button>
        {place.category === "hospitals" && place.phone ? (
          <a className="rounded-full bg-lotus px-3 py-1.5 text-xs font-semibold text-ink" href={telHref(place.phone)}>
            {t("call")}
          </a>
        ) : null}
      </div>
    </article>
  );
}
