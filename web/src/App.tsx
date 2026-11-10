import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FeedbackDialog } from "./components/FeedbackDialog";
import { Header } from "./components/Header";
import { MapCanvas } from "./components/MapCanvas";
import { Panel } from "./components/Panel";
import { applyTheme, readTheme, type Theme } from "./lib/theme";
import { useExplorer } from "./state/useExplorer";

export default function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const explorer = useExplorer();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("sheet-open", explorer.sheetExpanded);
  }, [explorer.sheetExpanded]);

  return (
    <div className="relative h-full">
      <Header
        theme={theme}
        onTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        onFeedback={() => explorer.setFeedbackOpen(true)}
        onHome={explorer.goHome}
      />
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
      />
      {explorer.areaDirty ? (
        <button
          type="button"
          data-testid="search-area"
          onClick={() => void explorer.loadViewport()}
          className="fixed top-20 left-1/2 z-20 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream shadow-lg md:left-[calc(50%+120px)] dark:bg-amberglow dark:text-ink"
        >
          {explorer.loading ? t("searching") : t("searchArea")}
        </button>
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
