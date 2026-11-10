import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { busInfoUrl, travelCards, type TravelCard } from "@shared/transport";
import { CITIES, cityById, isCityId, type CityId } from "@shared/cities";
import type { BusRoute } from "@shared/busRoutes";
import {
  TRAVEL_MODES,
  buildVehiclesLink,
  defaultTravelDate,
  type TravelMode,
  type TravelPlace,
  type VehiclesLink,
} from "@shared/vehiclesLink";
import { ApiError, fetchBusRoutes } from "../lib/api";
import type { Theme } from "../lib/theme";
import { BusRouteMap, routeColor } from "./BusRouteMap";

const fieldClass =
  "w-full rounded-2xl border border-sand bg-white/80 px-3 py-2 text-sm outline-none focus:border-lantern dark:border-white/10 dark:bg-black/30";

export function VehiclesPage({
  link,
  theme,
  onChange,
}: {
  link: VehiclesLink;
  theme: Theme;
  onChange: (href: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith("vi") ? "vi" : "en";
  const date = link.date ?? defaultTravelDate();
  const [bus, setBus] = useState<{ city: CityId; routes: BusRoute[]; status: "idle" | "error"; message: string | null } | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const fromCity: CityId | null = isCityId(link.from) ? link.from : null;
  const busCity = fromCity ?? "ha-noi";
  const busReady = bus?.city === busCity ? bus : null;
  const routes = busReady?.routes ?? [];
  const busState = link.mode === "bus" ? (busReady?.status ?? "loading") : "idle";
  const busMessage = busReady?.message ?? null;

  useEffect(() => {
    if (link.mode !== "bus") return;
    let cancelled = false;
    const city = busCity;
    fetchBusRoutes(city)
      .then((next) => {
        if (!cancelled) setBus({ city, routes: next, status: "idle", message: null });
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setBus({
            city,
            routes: [],
            status: "error",
            message: cause instanceof ApiError ? cause.message : "",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [link.mode, busCity]);

  function update(next: { mode?: TravelMode; from?: TravelPlace; to?: TravelPlace; date?: string }) {
    const mode = next.mode ?? link.mode;
    let from = next.from ?? link.from;
    const to = next.to ?? link.to;
    if (mode === "bus" && !isCityId(from)) from = "ha-noi";
    onChange(buildVehiclesLink({ mode, from, to, date: next.date ?? date }));
  }

  const cards = useMemo(
    () => travelCards({ mode: link.mode, from: link.from, to: link.to, date }),
    [link.mode, link.from, link.to, date],
  );
  const infoUrl = link.mode === "bus" ? busInfoUrl(busCity) : null;
  const showEnds = link.mode !== "bus";

  return (
    <main data-testid="vehicles-page" className="h-full overflow-y-auto bg-cream pt-16 text-ink dark:bg-[#120e0c] dark:text-cream">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        <div>
          <h1 className="font-display text-4xl leading-none md:text-5xl">{t("vehicles.title")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/90 dark:text-cream/85">{t("vehicles.partnerNote")}</p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-3xl bg-sand/80 p-1 dark:bg-white/10" role="tablist" aria-label={t("vehicles.title")}>
          {TRAVEL_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              id={`mode-${mode}`}
              data-testid={`mode-${mode}`}
              aria-selected={link.mode === mode}
              onClick={() => update({ mode })}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                link.mode === mode ? "bg-ink text-cream dark:bg-amberglow dark:text-ink" : "text-muted dark:text-sand"
              }`}
            >
              {t(`vehicles.modes.${mode}`)}
            </button>
          ))}
        </div>

        <form className="grid gap-3 sm:grid-cols-3" onSubmit={(event) => event.preventDefault()}>
          <label className="block text-sm font-semibold">
            {link.mode === "bus" ? t("vehicles.city") : t("vehicles.from")}
            <select className={`${fieldClass} mt-1`} value={link.mode === "bus" ? busCity : link.from} onChange={(event) => update({ from: event.target.value as TravelPlace })}>
              {(link.mode === "bus" ? CITIES : CITIES).map((city) => (
                <option key={city.id} value={city.id}>
                  {language === "vi" ? city.nameVi : city.nameEn}
                </option>
              ))}
              {link.mode !== "bus" ? <option value="other">{t("vehicles.other")}</option> : null}
            </select>
          </label>
          {showEnds ? (
            <label className="block text-sm font-semibold">
              {t("vehicles.to")}
              <select className={`${fieldClass} mt-1`} value={link.to} onChange={(event) => update({ to: event.target.value as TravelPlace })}>
                {CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {language === "vi" ? city.nameVi : city.nameEn}
                  </option>
                ))}
                <option value="other">{t("vehicles.other")}</option>
              </select>
            </label>
          ) : (
            <p className="self-end text-sm leading-relaxed text-muted sm:col-span-2 dark:text-sand/75">{t("vehicles.busIgnored")}</p>
          )}
          {showEnds ? (
            <label className="block text-sm font-semibold">
              {t("vehicles.date")}
              <input className={`${fieldClass} mt-1`} type="date" value={date} onChange={(event) => update({ date: event.target.value })} />
            </label>
          ) : null}
        </form>

        {link.mode === "bus" ? (
          <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="flex min-h-64 flex-col gap-2">
              <p className="text-sm leading-relaxed text-muted dark:text-sand/75">{t("vehicles.busLead")}</p>
              {infoUrl ? (
                <a className="w-fit rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream dark:bg-amberglow dark:text-ink" href={infoUrl} target="_blank" rel="noreferrer">
                  {t("vehicles.busInfo")}
                </a>
              ) : (
                <p className="text-sm text-muted dark:text-sand/75">{t("vehicles.busNoInfo")}</p>
              )}
              {busState === "loading" ? <p className="text-sm text-muted">{t("vehicles.busLoading")}</p> : null}
              {busState === "error" ? <p className="text-sm text-lotus">{busMessage || t("vehicles.busEmpty")}</p> : null}
              {busState === "idle" && routes.length === 0 ? <p className="text-sm text-muted dark:text-sand/75">{t("vehicles.busEmpty")}</p> : null}
              <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
                {routes.map((route, index) => {
                  const color = routeColor(route.colour, index);
                  const title = route.ref ? `${route.ref} · ${route.name || route.ref}` : route.name || route.id;
                  return (
                    <li key={route.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedRoute(route.id)}
                        className={`flex w-full items-start gap-2 rounded-2xl px-2 py-2 text-left ${
                          selectedRoute === route.id ? "bg-sand dark:bg-white/10" : "hover:bg-sand/70 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{title}</span>
                          {route.from || route.to ? (
                            <span className="block truncate text-xs text-muted dark:text-sand/70">
                              {[route.from, route.to].filter(Boolean).join(" → ")}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="h-80 min-h-80 overflow-hidden rounded-3xl border border-sand md:h-[32rem] dark:border-white/10">
              <BusRouteMap theme={theme} city={cityById(busCity)} routes={routes} selectedId={selectedRoute} onSelect={setSelectedRoute} />
            </div>
          </section>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <li key={card.id}>
                <TravelLink card={card} language={language} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function TravelLink({ card, language }: { card: TravelCard; language: "vi" | "en" }) {
  const { t } = useTranslation();
  return (
    <a
      data-testid={`travel-${card.id}`}
      href={card.href}
      target="_blank"
      rel="noreferrer"
      className="flex h-full flex-col rounded-3xl border border-sand bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-lantern dark:border-white/10 dark:bg-white/5"
    >
      <span className="font-display text-2xl leading-none">{t(`vehicles.partners.${card.id}`)}</span>
      <span className="mt-2 text-xs font-semibold tracking-wide text-lantern-deep uppercase dark:text-amberglow">
        {t(`vehicles.prefill.${card.prefilled}`)}
      </span>
      <span className="mt-2 text-sm leading-relaxed text-ink/90 dark:text-cream/85">{noteFor(card, language, t)}</span>
      <span className="mt-auto pt-3 text-xs font-semibold">{t("vehicles.openSite")} →</span>
    </a>
  );
}

function noteFor(card: TravelCard, language: "vi" | "en", t: (key: string, options?: Record<string, string>) => string): string {
  if (!card.note) return "";
  if (card.note !== "airports") return t(`vehicles.notes.${card.note}`);
  const parts: string[] = [];
  if (card.iataFrom && card.iataTo && card.iataFrom !== card.iataTo) {
    parts.push(t("vehicles.notes.airports", { from: card.iataFrom, to: card.iataTo }));
  }
  if (card.iataFrom && card.iataTo && card.iataFrom === card.iataTo) {
    parts.push(t("vehicles.notes.sameAirport"));
  }
  for (const hop of card.nearest ?? []) {
    const place = cityById(hop.city);
    const airport = cityById(hop.via);
    parts.push(
      t("vehicles.notes.nearest", {
        place: language === "vi" ? place.nameVi : place.nameEn,
        airport: language === "vi" ? airport.nameVi : airport.nameEn,
        iata: hop.iata,
      }),
    );
  }
  if (card.vanDon) parts.push(t("vehicles.notes.vanDon"));
  return parts.join(" ");
}
