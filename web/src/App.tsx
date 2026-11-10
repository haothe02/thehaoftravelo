import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CityId } from "@shared/cities";
import { buildVehiclesLink, defaultTravelDate, parseVehiclesLink } from "@shared/vehiclesLink";
import { FeedbackDialog } from "./components/FeedbackDialog";
import { Header } from "./components/Header";
import { MapCanvas } from "./components/MapCanvas";
import { Panel } from "./components/Panel";
import { VehiclesPage } from "./components/VehiclesPage";
import { shownError } from "./lib/format";
import { applyTheme, readTheme, type Theme } from "./lib/theme";
import { useExplorer } from "./state/useExplorer";

export default function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const [search, setSearch] = useState(() => window.location.search);
  const explorer = useExplorer();
  const vehicles = parseVehiclesLink(search);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onPop = () => setSearch(window.location.search);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("sheet-open", !vehicles && explorer.sheetExpanded);
  }, [explorer.sheetExpanded, vehicles]);

  function openVehicles() {
    const from: CityId = explorer.city?.id ?? "ha-noi";
    const to: CityId = from === "ha-noi" ? "da-nang" : "ha-noi";
    const href = buildVehiclesLink({ mode: "bus", from, to, date: defaultTravelDate() });
    history.pushState(null, "", href);
    setSearch(window.location.search);
  }

  function goMapHome() {
    explorer.goHome();
    setSearch(window.location.search);
  }

  useEffect(() => {
    if (vehicles) return;
    explorer.mapRef.current?.getMap()?.resize();
  }, [vehicles, explorer.mapRef]);

  const header = (
    <Header
      theme={theme}
      onTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      onFeedback={() => explorer.setFeedbackOpen(true)}
      onHome={vehicles ? goMapHome : explorer.goHome}
      onVehicles={openVehicles}
      vehiclesActive={Boolean(vehicles)}
    />
  );

  return (
    <div className="relative h-full">
      {header}
      {vehicles ? null : (
      <div className="h-full">
          <MapCanvas
            mapRef={explorer.mapRef}
            initialView={explorer.initialView}
            theme={theme}
            city={explorer.city}
            places={explorer.places}
            selected={explorer.selected}
            onLoad={explorer.onMapLoad}
            onMoveEnd={explorer.onMoveEnd}
            onSelectCity={explorer.selectCity}
            onSelectPlace={explorer.selectPlace}
            onClearPlace={explorer.clearPlace}
            onShared={(kind) => explorer.showToast(t(kind === "shared" ? "shared" : "copied"))}
            drawing={explorer.drawing}
            customArea={explorer.customArea}
            onArea={(points) => void explorer.loadArea(points)}
            onAreaReject={explorer.rejectArea}
          />
          <Panel
            city={explorer.city}
            places={explorer.places}
            searchHits={explorer.searchHits}
            categories={explorer.categories}
            openNow={explorer.openNow}
            onOpenNow={explorer.setOpenNow}
            onToggleCategory={explorer.toggleCategory}
            loading={explorer.loading}
            error={explorer.error}
            hiddenForMissingHours={explorer.hiddenForMissingHours}
            weather={explorer.weather}
            expanded={explorer.sheetExpanded}
            onExpanded={explorer.setSheetExpanded}
            onSelectCity={explorer.selectCity}
            onHome={explorer.goHome}
            onSearch={(query) => void explorer.searchInCity(query)}
            onClearSearch={explorer.clearSearch}
            onNearMe={explorer.nearMe}
            onFitCity={explorer.fitCity}
            onSelectPlace={explorer.selectPlace}
            selectedId={explorer.placeId}
            onClearArea={explorer.clearCustomArea}
            areaActive={explorer.customArea != null}
          />
          <div className="fixed top-48 right-3 z-20 flex max-w-[14rem] flex-col items-end gap-2 md:right-4">
            <button
              type="button"
              data-testid="custom-area"
              aria-pressed={explorer.drawing}
              onClick={explorer.toggleDrawing}
              className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
                explorer.drawing
                  ? "bg-lantern text-ink"
                  : "bg-ink text-cream dark:bg-amberglow dark:text-ink"
              }`}
            >
              {explorer.drawing ? t("customAreaOn") : t("customArea")}
            </button>
            {explorer.drawing || explorer.drawNote || areaError(explorer.error) ? (
              <p className="rounded-2xl bg-cream/95 px-3 py-2 text-xs leading-relaxed text-ink shadow-lg dark:bg-[#2a211c] dark:text-cream" role="status">
                {explorer.drawNote ? t(explorer.drawNote === "open" ? "drawOpen" : "drawTiny") : null}
                {explorer.drawNote && areaError(explorer.error) ? " " : null}
                {areaError(explorer.error) ? shownError(explorer.error!, t) : null}
                {!explorer.drawNote && !areaError(explorer.error) ? t("drawHint") : null}
              </p>
            ) : null}
          </div>
          {explorer.areaDirty && !explorer.drawing ? (
            <button
              type="button"
              data-testid="search-area"
              onClick={() => void explorer.loadViewport()}
              className="fixed top-20 left-1/2 z-20 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream shadow-lg md:left-[calc(50%+120px)] dark:bg-amberglow dark:text-ink"
            >
              {explorer.loading ? t("searching") : t("searchArea")}
            </button>
          ) : null}
      </div>
      )}
      {vehicles ? (
        <VehiclesPage
          link={{ ...vehicles, date: vehicles.date ?? defaultTravelDate() }}
          theme={theme}
          onChange={(href) => {
            history.replaceState(null, "", href);
            setSearch(window.location.search);
          }}
        />
      ) : null}
      {explorer.toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-cream md:bottom-8" role="status">
          {explorer.toast}
        </div>
      ) : null}
      <FeedbackDialog
        open={explorer.feedbackOpen}
        onClose={() => explorer.setFeedbackOpen(false)}
        cityId={explorer.city?.id ?? null}
        placeId={explorer.placeId}
        theme={theme}
        readView={() => {
          const map = explorer.mapRef.current?.getMap();
          const center = map?.getCenter();
          return {
            lat: center?.lat ?? null,
            lng: center?.lng ?? null,
            zoom: map?.getZoom() ?? null,
          };
        }}
      />
    </div>
  );
}

function areaError(error: string | null): boolean {
  return error === "area_too_large" || error === "area_too_small" || error === "area_outside" || error === "bad_poly";
}
