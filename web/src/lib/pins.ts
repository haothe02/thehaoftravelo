import type { Map as MapLibreMap } from "maplibre-gl";
import { CATEGORIES, SEARCH_COLOR } from "@shared/categories";

function drawGlyph(ctx: CanvasRenderingContext2D, kind: string) {
  ctx.strokeStyle = "#fffaf3";
  ctx.fillStyle = "#fffaf3";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (kind === "restaurants") {
    ctx.beginPath();
    ctx.moveTo(24, 18);
    ctx.lineTo(24, 46);
    ctx.moveTo(18, 18);
    ctx.lineTo(18, 26);
    ctx.moveTo(30, 18);
    ctx.lineTo(30, 26);
    ctx.moveTo(40, 18);
    ctx.lineTo(40, 46);
    ctx.moveTo(36, 18);
    ctx.quadraticCurveTo(46, 18, 46, 28);
    ctx.stroke();
    return;
  }
  if (kind === "homestays") {
    ctx.beginPath();
    ctx.moveTo(16, 30);
    ctx.lineTo(32, 16);
    ctx.lineTo(48, 30);
    ctx.stroke();
    ctx.strokeRect(20, 30, 24, 16);
    return;
  }
  if (kind === "hotels") {
    ctx.strokeRect(20, 16, 24, 32);
    for (const y of [24, 32, 40]) {
      ctx.fillRect(26, y, 4, 4);
      ctx.fillRect(34, y, 4, 4);
    }
    return;
  }
  if (kind === "shops") {
    ctx.beginPath();
    ctx.moveTo(22, 26);
    ctx.lineTo(18, 46);
    ctx.lineTo(46, 46);
    ctx.lineTo(42, 26);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(32, 26, 8, Math.PI, 0);
    ctx.stroke();
    return;
  }
  if (kind === "gas") {
    ctx.strokeRect(22, 16, 16, 28);
    ctx.beginPath();
    ctx.moveTo(38, 22);
    ctx.lineTo(46, 22);
    ctx.lineTo(46, 32);
    ctx.lineTo(38, 32);
    ctx.moveTo(46, 24);
    ctx.lineTo(50, 20);
    ctx.stroke();
    ctx.fillRect(26, 44, 12, 4);
    return;
  }
  if (kind === "hospitals") {
    ctx.fillRect(28, 16, 8, 32);
    ctx.fillRect(16, 28, 32, 8);
    return;
  }
  if (kind === "stations") {
    ctx.beginPath();
    ctx.moveTo(18, 30);
    ctx.lineTo(32, 16);
    ctx.lineTo(46, 30);
    ctx.stroke();
    ctx.strokeRect(22, 30, 20, 14);
    ctx.beginPath();
    ctx.moveTo(16, 48);
    ctx.lineTo(48, 48);
    ctx.moveTo(26, 48);
    ctx.lineTo(26, 42);
    ctx.moveTo(38, 48);
    ctx.lineTo(38, 42);
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.arc(28, 28, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(36, 36);
  ctx.lineTo(48, 48);
  ctx.stroke();
}

export function installPinIcons(map: MapLibreMap): void {
  const specs = [
    ...CATEGORIES.map((category) => ({ id: category.id, color: category.color })),
    { id: "search", color: SEARCH_COLOR },
  ];
  for (const spec of specs) {
    const imageId = `pin-${spec.id}`;
    if (map.hasImage(imageId)) continue;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.clearRect(0, 0, 64, 64);
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = spec.color;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#fffaf3";
    ctx.stroke();
    drawGlyph(ctx, spec.id);
    const image = ctx.getImageData(0, 0, 64, 64);
    map.addImage(imageId, image, { pixelRatio: 2 });
  }
}
