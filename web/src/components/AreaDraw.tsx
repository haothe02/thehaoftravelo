import { useEffect, useRef, type PointerEvent, type RefObject, type WheelEvent } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { LatLng } from "@shared/overpass";

type LngLat = [number, number];

export function AreaDraw({
  mapRef,
  mapEpoch,
  onSketch,
  onComplete,
  onReject,
}: {
  mapRef: RefObject<MapRef | null>;
  mapEpoch: number;
  onSketch: (points: LngLat[] | null) => void;
  onComplete: (points: LatLng[]) => void;
  onReject: (reason: "open" | "tiny") => void;
}) {
  const stroke = useRef<{ start: LngLat; points: LngLat[]; pixels: number } | null>(null);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.dragPan.disable();
    map.boxZoom.disable();
    map.doubleClickZoom.disable();
    return () => {
      if (!map.dragPan.isEnabled()) map.dragPan.enable();
      map.boxZoom.enable();
      map.doubleClickZoom.enable();
    };
  }, [mapRef, mapEpoch]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      stroke.current = null;
      onSketch(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSketch]);

  function locate(event: PointerEvent<HTMLDivElement>): LngLat | null {
    const map = mapRef.current?.getMap();
    const canvas = map?.getCanvas();
    if (!map || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const ll = map.unproject([event.clientX - rect.left, event.clientY - rect.top]);
    return [ll.lng, ll.lat];
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    const map = mapRef.current?.getMap();
    const canvas = map?.getCanvas();
    if (!map || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const around = map.unproject([event.clientX - rect.left, event.clientY - rect.top]);
    const next = map.getZoom() - event.deltaY * 0.0015;
    map.easeTo({ zoom: Math.max(4, Math.min(17, next)), around, duration: 0 });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = locate(event);
    if (!point) return;
    stroke.current = { start: point, points: [point], pixels: 0 };
    onSketch([point]);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = stroke.current;
    const map = mapRef.current?.getMap();
    if (!current || !map) return;
    const point = locate(event);
    if (!point) return;
    const last = current.points[current.points.length - 1];
    const from = map.project(last);
    const to = map.project(point);
    const step = Math.hypot(from.x - to.x, from.y - to.y);
    if (step < 4) return;
    current.pixels += step;
    current.points.push(point);
    onSketch(current.points.slice());
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = stroke.current;
    stroke.current = null;
    onSketch(null);
    const map = mapRef.current?.getMap();
    const end = locate(event);
    if (!current || !map || !end) return;
    const startPx = map.project(current.start);
    const endPx = map.project(end);
    const close = Math.hypot(startPx.x - endPx.x, startPx.y - endPx.y);
    if (current.pixels < 70 || current.points.length < 4) {
      onReject("tiny");
      return;
    }
    if (close > 36) {
      onReject("open");
      return;
    }
    onComplete(current.points.map(([lng, lat]) => [lat, lng]));
  }

  return (
    <div
      data-testid="area-draw"
      className="area-draw absolute inset-0 z-10"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        stroke.current = null;
        onSketch(null);
      }}
    />
  );
}
