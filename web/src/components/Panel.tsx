import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORIES, CATEGORY_ORDER, type CategoryId } from "@shared/categories";
import { filterCities, type City } from "@shared/cities";
import type { Place } from "@shared/places";
import type { Weather } from "../lib/api";
import { placeTitle, weatherKey } from "../lib/format";
import { WeatherGlyph } from "./WeatherGlyph";

export function Panel({
  city,
  places,
  searchHits,
  categories,
  openNow,
  onOpenNow,
  onToggleCategory,
  loading,
  error,
  hiddenForMissingHours,
  weather,
  expanded,
  onExpanded,
  onSelectCity,
  onHome,
  onSearch,
  onClearSearch,
  onNearMe,
  onFitCity,
  onSelectPlace,
  selectedId,
}: {
  city: City | null;
  places: Place[];
  searchHits: Place[];
  categories: Record<CategoryId, boolean>;
  openNow: boolean;
  onOpenNow: (value: boolean) => void;
  onToggleCategory: (id: CategoryId) => void;
  loading: boolean;
  error: string | null;
  hiddenForMissingHours: number;
  weather: Weather | null;
  expanded: boolean;
  onExpanded: (value: boolean) => void;
  onSelectCity: (id: City["id"]) => void;
  onHome: () => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onNearMe: () => void;
  onFitCity: () => void;
  onSelectPlace: (place: Place) => void;
  selectedId: string | null;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith("vi") ? "vi" : "en";
  const [cityQuery, setCityQuery] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const matches = useMemo(() => filterCities(cityQuery), [cityQuery]);
  const intro = city ? (language === "vi" ? city.introVi : city.introEn) : "";
  const name = city ? (language === "vi" ? city.nameVi : city.nameEn) : "";
  const condition = weatherKey(weather?.weatherCode ?? null);

  return (
    <aside
      className={`sheet fixed z-20 flex flex-col overflow-hidden border-sand bg-cream/95 text-ink shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#1c1612]/95 dark:text-cream max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-3xl max-md:border-t ${
        expanded ? "max-md:h-[82vh]" : "max-md:h-[46vh]"
      } md:top-20 md:bottom-4 md:left-4 md:w-[400px] md:rounded-3xl md:border`}
    >
      <button
        type="button"
        className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-sand md:hidden dark:bg-white/20"
        aria-expanded={expanded}
        onClick={() => onExpanded(!expanded)}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3 pb-3">
        <label className="block">
          <span className="sr-only">{t("citySearch")}</span>
          <input
            value={cityQuery}
            onChange={(event) => setCityQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches[0]) {
                event.preventDefault();
                onSelectCity(matches[0].id);
                setCityQuery("");
              }
            }}
            placeholder={t("citySearch")}
            className="w-full rounded-2xl border border-sand bg-white/80 px-3 py-2 text-sm outline-none focus:border-lantern dark:border-white/10 dark:bg-black/20"
          />
        </label>

        {!city ? (
          <>
            <div>
              <h1 className="font-display text-3xl leading-tight">{t("homeTitle")}</h1>
              <p className="mt-1 text-sm text-muted dark:text-sand/75">{t("homeHint")}</p>
            </div>
            <ul className="space-y-1" data-testid="city-list">
              {matches.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCity(item.id)}
                    className="flex w-full items-baseline justify-between rounded-2xl px-3 py-2 text-left hover:bg-sand/70 dark:hover:bg-white/5"
                  >
                    <span className="font-semibold">{language === "vi" ? item.nameVi : item.nameEn}</span>
                    <span className="text-xs text-muted dark:text-sand/60">
                      {language === "vi" ? item.nameEn : item.nameVi}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <button type="button" onClick={onHome} className="text-xs font-semibold tracking-wide text-lantern-deep uppercase dark:text-amberglow">
                  ← {t("allCities")}
                </button>
                <h1 className="font-display text-4xl leading-none">{name}</h1>
              </div>
              <div className="shrink-0 text-right">
                {weather?.temperature != null ? (
                  <div className="flex items-center gap-1">
                    <WeatherGlyph code={condition} />
                    <div>
                      <div className="font-display text-2xl leading-none">{Math.round(weather.temperature)}°</div>
                      <div className="text-[11px] text-muted dark:text-sand/70">{t(`weather.${condition}`)}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted">{t("weatherUnavailable")}</p>
                )}
                {weather?.high != null && weather.low != null ? (
                  <p className="text-[11px] text-muted dark:text-sand/70">
                    {t("highLow", { high: Math.round(weather.high), low: Math.round(weather.low) })}
                  </p>
                ) : null}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-ink/90 dark:text-cream/90">{intro}</p>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_ORDER.map((id) => {
                const on = categories[id];
                const color = CATEGORIES.find((item) => item.id === id)?.color;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggleCategory(id)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      on ? "border-transparent text-ink" : "border-sand text-muted opacity-70 dark:border-white/15"
                    }`}
                    style={on ? { background: color } : undefined}
                  >
                    {t(`categories.${id}`)}
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={openNow} onChange={(event) => onOpenNow(event.target.checked)} />
              {t("openNow")}
            </label>
            {openNow ? (
              <p className="text-xs leading-relaxed text-muted dark:text-sand/75">
                {t("hoursNote")}
                {hiddenForMissingHours > 0 ? ` ${t("hiddenHours", { count: hiddenForMissingHours })}` : ""}
              </p>
            ) : null}

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (placeQuery.trim().length >= 2) onSearch(placeQuery.trim());
              }}
            >
              <input
                value={placeQuery}
                onChange={(event) => setPlaceQuery(event.target.value)}
                placeholder={t("placeSearch")}
                className="min-w-0 flex-1 rounded-2xl border border-sand bg-white/80 px-3 py-2 text-sm outline-none focus:border-lantern dark:border-white/10 dark:bg-black/20"
              />
              <button type="submit" className="rounded-2xl bg-ink px-3 py-2 text-sm font-semibold text-cream dark:bg-amberglow dark:text-ink">
                {t("placeSubmit")}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onNearMe} className="rounded-full border border-sand px-3 py-1.5 text-xs font-semibold dark:border-white/15">
                {t("nearMe")}
              </button>
              <button type="button" onClick={onFitCity} className="rounded-full border border-sand px-3 py-1.5 text-xs font-semibold dark:border-white/15">
                {t("fitCity")}
              </button>
              {searchHits.length > 0 ? (
                <button type="button" onClick={onClearSearch} className="rounded-full border border-sand px-3 py-1.5 text-xs font-semibold dark:border-white/15">
                  {t("clearSearch")}
                </button>
              ) : null}
            </div>

            {loading ? <p className="text-sm text-muted">{t("loadingPlaces")}</p> : null}
            {error ? (
              <p className="text-sm text-lotus">{error === "geo-denied" || error === "geo" ? t(error === "geo" ? "geoUnavailable" : "geoDenied") : error}</p>
            ) : null}

            <div className="flex items-center justify-between text-xs text-muted dark:text-sand/70">
              <span>{t("placesCount", { count: places.length })}</span>
              {searchHits.length > 0 ? <span>{t("searchResults")}</span> : null}
            </div>
            {places.length === 0 && !loading ? <p className="text-sm text-muted dark:text-sand/75">{t("noPlaces")}</p> : null}
            <ul className="space-y-1">
              {places.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPlace(place)}
                    className={`flex w-full items-start gap-2 rounded-2xl px-2 py-2 text-left ${
                      selectedId === place.id ? "bg-sand dark:bg-white/10" : "hover:bg-sand/60 dark:hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: CATEGORIES.find((item) => item.id === place.category)?.color ?? "#6d5bd0" }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {placeTitle(place, language, t("unnamed"))}
                      </span>
                      <span className="text-xs text-muted dark:text-sand/60">{t(`categories.${place.category}`)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        </div>
      <div className="shrink-0 border-t border-sand/80 px-4 py-3 dark:border-white/10">
        <p className="text-xs font-semibold tracking-wide uppercase">{t("emergency")}</p>
        <div className="mt-2 flex gap-2">
          <a className="rounded-full bg-[#d64545] px-3 py-1.5 text-xs font-bold text-white" href="tel:115">
            {t("ambulance")}
          </a>
          <a className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-cream dark:bg-cream dark:text-ink" href="tel:113">
            {t("police")}
          </a>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted dark:text-sand/70">{t("credit")}</p>
      </div>
    </aside>
  );
}
