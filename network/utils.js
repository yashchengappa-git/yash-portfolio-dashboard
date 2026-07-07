/*
|--------------------------------------------------------------------------
| Portfolio Network — Utilities
|--------------------------------------------------------------------------
| Pure helpers only. No DOM manipulation, no reading of global dashboard
| state. Every function here takes plain values in and returns plain
| values out.
*/

const NetworkUtils = (() => {

  // ---- Sizing -------------------------------------------------------------

  // Company node radius from portfolio weight (0..1 fraction of book).
  // Uses a sqrt scale so *area* (not radius) tracks allocation — a 2x bigger
  // position should look roughly 2x bigger by eye, not 4x.
  function radiusForWeight(weight, minWeight, maxWeight, settings) {
    const { stockBaseRadius, stockMaxRadius } = settings;
    if (!isFinite(weight) || maxWeight <= minWeight) return stockBaseRadius;
    const t = Math.sqrt((weight - minWeight) / (maxWeight - minWeight || 1));
    return stockBaseRadius + t * (stockMaxRadius - stockBaseRadius);
  }

  // ---- Geometry -------------------------------------------------------------

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // Smooth quadratic-ish Bezier between two nodes, bowing perpendicular to
  // the line between them so overlapping links never sit exactly on top of
  // each other. `curvature` in px; 0 gives a nearly-straight (but still
  // curved-cap) line.
  // Cubic Bezier with two control points that flex in *opposite*
  // directions — an S-curve rather than a single uniform bow. This is
  // what makes the link read as "fluid" rather than a slightly-bent
  // straight line. Curvature scales with link length so short links
  // (theme -> company) and long ones (portfolio -> theme) both look
  // proportionate rather than the short ones looking barely curved.
  function bezierPath(source, target, curvatureRatio = 0.28) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const curvature = Math.min(46, len * curvatureRatio);

    const p1x = source.x + dx * 0.32 + nx * curvature;
    const p1y = source.y + dy * 0.32 + ny * curvature;
    const p2x = source.x + dx * 0.68 - nx * curvature * 0.7;
    const p2y = source.y + dy * 0.68 - ny * curvature * 0.7;

    return `M${source.x},${source.y} C${p1x},${p1y} ${p2x},${p2y} ${target.x},${target.y}`;
  }

  // Points evenly around a circle, used for laying out theme nodes around
  // Portfolio, and company nodes around their theme.
  function circlePositions(center, radius, count, startAngle = -Math.PI / 2) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i / count) * Math.PI * 2;
      positions.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    }
    return positions;
  }

  // ---- Color ----------------------------------------------------------------

  function hexToRgba(hex, alpha = 1) {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean.length === 3
      ? clean.split("").map(c => c + c).join("")
      : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ---- Text -----------------------------------------------------------------

  function truncate(str, max) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
  }

  // ---- Numbers ----------------------------------------------------------------

  function formatPct(value, decimals = 1) {
    if (!isFinite(value)) return "\u2014";
    const sign = value >= 0 ? "+" : "\u2212";
    return `${sign}${Math.abs(value).toFixed(decimals)}%`;
  }

  function formatWeightPct(value, decimals = 1) {
    if (!isFinite(value)) return "\u2014";
    return `${value.toFixed(decimals)}%`;
  }

  function formatMoney(value, decimals = 0) {
    if (!isFinite(value)) return "\u2014";
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }

  return {
    radiusForWeight,
    dist,
    bezierPath,
    circlePositions,
    hexToRgba,
    truncate,
    formatPct,
    formatWeightPct,
    formatMoney,
  };
})();
