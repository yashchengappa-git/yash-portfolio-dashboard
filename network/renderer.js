/*
|--------------------------------------------------------------------------
| Portfolio Network — Renderer
|--------------------------------------------------------------------------
| Only draws. Never attaches click/drag handlers (that's interactions.js)
| and never decides *when* something should animate (that's animations.js
| — this file just calls into it).
*/

const NetworkRenderer = (() => {

  function init(svg, { onLogoUrl }) {
    const root = svg.append("g").attr("class", "network-root");
    const linkLayer = root.append("g").attr("class", "network-links");
    const nodeLayer = root.append("g").attr("class", "network-nodes");
    return { root, linkLayer, nodeLayer, onLogoUrl };
  }

  // ---- Links ------------------------------------------------------------

  function renderLinks(linkLayer, links) {
    const sel = linkLayer.selectAll("path.network-link")
      .data(links, d => d.id);

    sel.exit().remove();

    const enter = sel.enter().append("path")
      .attr("class", "network-link")
      .attr("fill", "none")
      .style("opacity", 0.35);

    return enter.merge(sel);
  }

  function updateLinkPositions(linkSelection) {
    linkSelection.attr("d", d => NetworkUtils.bezierPath(d.source, d.target));
  }

  // ---- Nodes --------------------------------------------------------------

  function renderNodes(nodeLayer, nodes, { onLogoUrl }) {
    const sel = nodeLayer.selectAll("g.network-node")
      .data(nodes, d => d.id);

    sel.exit().remove();

    const enter = sel.enter().append("g")
      .attr("class", d => `network-node network-node--${d.type}`)
      .attr("data-id", d => d.id);

    enter.append("circle")
      .attr("class", "network-node-halo")
      .attr("r", d => d.radius + 10)
      .style("opacity", 0);

    enter.append("circle")
      .attr("class", "network-node-circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color);

    // Logos only make sense on company nodes, once there's room for one.
    enter.filter(d => d.type === "company")
      .append("image")
      .attr("class", "network-node-logo")
      .attr("width", d => d.radius * 1.1)
      .attr("height", d => d.radius * 1.1)
      .attr("x", d => -d.radius * 0.55)
      .attr("y", d => -d.radius * 0.55)
      .attr("clip-path", d => `circle(${d.radius * 0.55}px at center)`)
      .attr("href", d => onLogoUrl(d.id))
      .on("error", function () { d3.select(this).style("display", "none"); });

    enter.append("text")
      .attr("class", "network-node-label")
      .attr("text-anchor", "middle")
      .attr("y", d => d.radius + 16)
      .text(d => d.label);

    const merged = enter.merge(sel);

    merged.select(".network-node-circle").attr("r", d => d.radius).attr("fill", d => d.color);
    merged.select(".network-node-halo").attr("r", d => d.radius + 10);
    merged.select(".network-node-label").attr("y", d => d.radius + 16).text(d => d.label);

    return merged;
  }

  function updateNodePositions(nodeSelection) {
    nodeSelection.attr("transform", d => `translate(${d.x},${d.y})`);
  }

  // ---- Expanded card --------------------------------------------------------

  function themeCardHTML(theme) {
    const holdingsRows = theme.holdings
      .map(h => `<div class="nc-holding">${h.sym}</div>`)
      .join("");

    return `
      <div class="network-card">
        <div class="nc-eyebrow" style="color:${theme.color}">${theme.label}</div>
        <div class="nc-title">${theme.themeDescription}</div>
        <div class="nc-row">
          <div class="nc-stat">
            <div class="nc-stat-label">Weight</div>
            <div class="nc-stat-value">${NetworkUtils.formatWeightPct(theme.weight)}</div>
          </div>
        </div>
        <div class="nc-section-label">Holdings</div>
        <div class="nc-holdings">${holdingsRows}</div>
      </div>
    `;
  }

  function companyCardHTML(c) {
    const riskRows = (c.risks || [])
      .map(r => `<div class="nc-risk">${r}</div>`)
      .join("");

    const gainClass = c.gainPct >= 0 ? "nc-positive" : "nc-negative";

    return `
      <div class="network-card">
        <div class="nc-eyebrow" style="color:${c.themeColor}">${c.sym}</div>
        <div class="nc-title">${c.title}</div>
        <div class="nc-overview">${c.overview}</div>
        <div class="nc-row">
          <div class="nc-stat">
            <div class="nc-stat-label">Weight</div>
            <div class="nc-stat-value">${NetworkUtils.formatWeightPct(c.weight)}</div>
          </div>
          <div class="nc-stat">
            <div class="nc-stat-label">Avg Cost</div>
            <div class="nc-stat-value">${NetworkUtils.formatMoney(c.avgCost, 2)}</div>
          </div>
          <div class="nc-stat">
            <div class="nc-stat-label">Gain</div>
            <div class="nc-stat-value ${gainClass}">${NetworkUtils.formatPct(c.gainPct)}</div>
          </div>
        </div>
        <div class="nc-section-label">Investment Thesis</div>
        <div class="nc-thesis">${c.thesis}</div>
        <div class="nc-section-label">Risks</div>
        <div class="nc-risks">${riskRows}</div>
      </div>
    `;
  }

  function rootCardHTML(datum) {
    const gainClass = datum.totalGain >= 0 ? "nc-positive" : "nc-negative";
    return `
      <div class="network-card">
        <div class="nc-eyebrow" style="color:${datum.color}">PORTFOLIO</div>
        <div class="nc-title">${datum.dateLabel}</div>
        <div class="nc-row">
          <div class="nc-stat">
            <div class="nc-stat-label">Invested</div>
            <div class="nc-stat-value">${NetworkUtils.formatMoney(datum.totalDep, 0)}</div>
          </div>
          <div class="nc-stat">
            <div class="nc-stat-label">Total Gain</div>
            <div class="nc-stat-value ${gainClass}">${NetworkUtils.formatMoney(datum.totalGain, 0)}</div>
          </div>
        </div>
      </div>
    `;
  }

  const CARD_W = { theme: 260, company: 280, root: 240 };
  const CARD_H = { theme: 230, company: 300, root: 170 };

  function cardDims(type) {
    return { w: CARD_W[type] || 260, h: CARD_H[type] || 260 };
  }

  function showExpandedCard(overlay, datum, pos) {
    const { w, h } = cardDims(datum.type);

    const div = overlay.append("div")
      .attr("class", "network-card-overlay")
      .style("left", `${pos.x - w / 2}px`)
      .style("top", `${pos.y - h / 2}px`)
      .style("width", `${w}px`)
      .style("height", `${h}px`)
      .style("opacity", 0)
      .style("transform", "scale(0.92)")
      .html(datum.type === "theme" ? themeCardHTML(datum) : datum.type === "root" ? rootCardHTML(datum) : companyCardHTML(datum));

    NetworkAnimations.expandCard(div);
    return div;
  }

  function hideExpandedCard(div) {
    if (!div || div.empty()) return;
    NetworkAnimations.collapseCard(div).on("end", function () {
      d3.select(this).remove();
    });
  }

  // Keeps an open card glued to its node while the user pans/zooms —
  // called from interactions.js on every zoom event.
  function repositionCard(div, pos, type) {
    if (!div || div.empty()) return;
    const { w, h } = cardDims(type);
    div.style("left", `${pos.x - w / 2}px`).style("top", `${pos.y - h / 2}px`);
  }

  return {
    init,
    renderLinks,
    updateLinkPositions,
    renderNodes,
    updateNodePositions,
    showExpandedCard,
    hideExpandedCard,
    repositionCard,
  };
})();
