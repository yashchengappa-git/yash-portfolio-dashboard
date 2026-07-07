/*
|--------------------------------------------------------------------------
| Portfolio Network — Graph Engine
|--------------------------------------------------------------------------
| Reads:
|   window.FINAL        — array of live holdings from index.html
|                          ({ sym, qty, price, netCost, pnlPct, ... })
|   window.FINAL_TOTAL   — total portfolio value from index.html
|   window.logoUrl(sym)  — existing logo helper from index.html
|
| Never stores prices/allocation itself — always reads them fresh from
| the dashboard so the graph can never drift out of sync with it.
*/

const NetworkGraph = (() => {

  let simulation = null;

  function buildData() {
    const FINAL = window.FINAL || [];
    const TOTAL = window.FINAL_TOTAL || FINAL.reduce((s, h) => s + h.qty * h.price, 0) || 1;
    const settings = NETWORK.settings;
    const themeById = Object.fromEntries(NETWORK.themes.map(t => [t.id, t]));

    // Only build theme nodes for themes that actually have a current holding —
    // an empty theme node would just be portfolio-shaped clutter.
    const usedThemeIds = new Set();
    const companies = FINAL
      .filter(h => h.qty > 0)
      .map(h => {
        const curVal = h.qty * h.price;
        const weight = (curVal / TOTAL) * 100;
        const themeId = NETWORK.assignments[h.sym] || "other";
        usedThemeIds.add(themeId);
        const desc = NETWORK.companyDescriptions[h.sym] || {
          title: h.sym,
          overview: "Profile coming soon — add this ticker to network/data.js.",
          thesis: "Add your investment thesis in network/data.js.",
          risks: [],
        };
        return {
          id: h.sym,
          type: "company",
          themeId,
          label: h.sym,
          weight,
          curVal,
          avgCost: h.qty ? h.netCost / h.qty : 0,
          gainPct: h.pnlPct,
          title: desc.title,
          overview: desc.overview,
          thesis: desc.thesis,
          risks: desc.risks,
        };
      });

    const weightByTheme = {};
    companies.forEach(c => { weightByTheme[c.themeId] = (weightByTheme[c.themeId] || 0) + c.weight; });

    const themes = NETWORK.themes
      .filter(t => usedThemeIds.has(t.id))
      .map(t => ({
        id: t.id,
        type: "theme",
        label: t.label,
        color: t.color,
        weight: weightByTheme[t.id] || 0,
        themeDescription: t.description,
        holdings: companies.filter(c => c.themeId === t.id),
      }));

    const minWeight = Math.min(...companies.map(c => c.weight), 0);
    const maxWeight = Math.max(...companies.map(c => c.weight), 1);

    // ---- Home positions (radial layout) --------------------------------

    const cx = 0, cy = 0;
    const themePositions = NetworkUtils.circlePositions({ x: cx, y: cy }, settings.themeDistance, themes.length || 1);

    const root = {
      id: "__portfolio__",
      type: "root",
      label: "Portfolio",
      color: "#D9DEE8",
      radius: settings.centralNodeRadius,
      weight: 100,
      x: cx, y: cy, homeX: cx, homeY: cy,
    };

    const nodes = [root];
    const links = [];

    themes.forEach((theme, i) => {
      const pos = themePositions[i];
      const themeNode = {
        ...theme,
        radius: settings.themeRadius,
        color: theme.color,
        x: pos.x, y: pos.y, homeX: pos.x, homeY: pos.y,
      };
      nodes.push(themeNode);
      links.push({ id: `${root.id}->${theme.id}`, source: root.id, target: theme.id });

      const companyPositions = NetworkUtils.circlePositions(pos, settings.linkDistance, theme.holdings.length || 1);
      theme.holdings.forEach((c, j) => {
        const cpos = companyPositions[j];
        const radius = NetworkUtils.radiusForWeight(c.weight, minWeight, maxWeight, settings);
        nodes.push({
          ...c,
          color: theme.color,
          themeColor: theme.color,
          radius,
          x: cpos.x, y: cpos.y, homeX: cpos.x, homeY: cpos.y,
        });
        links.push({ id: `${theme.id}->${c.id}`, source: theme.id, target: c.id });
      });
    });

    return { nodes, links, settings };
  }

  function mount(containerEl) {
    const container = d3.select(containerEl);
    container.selectAll("*").remove();
    if (simulation) simulation.stop();

    const rect = containerEl.getBoundingClientRect();
    const width = rect.width || containerEl.clientWidth || 640;
    const height = rect.height || containerEl.clientHeight || 520;

    const svg = container.append("svg")
      .attr("class", "network-svg")
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Expanded cards render here as plain positioned HTML, not SVG
    // foreignObject — foreignObject positioning under an animated SVG
    // transform is unreliable on mobile Safari in particular.
    const overlay = container.append("div").attr("class", "network-overlay");

    const { nodes, links, settings } = buildData();
    const nodesById = Object.fromEntries(nodes.map(n => [n.id, n]));

    const { root, linkLayer, nodeLayer } = NetworkRenderer.init(svg, { onLogoUrl: sym => (window.logoUrl ? window.logoUrl(sym) : "") });

    const linkSelection = NetworkRenderer.renderLinks(linkLayer, links);
    const nodeSelection = NetworkRenderer.renderNodes(nodeLayer, nodes, {
      onLogoUrl: sym => (window.logoUrl ? window.logoUrl(sym) : ""),
    });

    simulation = d3.forceSimulation(nodes)
      .velocityDecay(settings.velocityDecay)
      .alphaDecay(settings.alphaDecay)
      .force("link", d3.forceLink(links).id(d => d.id).distance(l => {
        return l.target.type === "theme" ? settings.themeDistance : settings.linkDistance;
      }).strength(0.35))
      .force("charge", d3.forceManyBody().strength(settings.chargeStrength))
      .force("collide", d3.forceCollide(d => d.radius + settings.collidePadding))
      .force("homeX", d3.forceX(d => d.homeX).strength(settings.dragSpringStrength))
      .force("homeY", d3.forceY(d => d.homeY).strength(settings.dragSpringStrength))
      .on("tick", () => {
        NetworkRenderer.updateLinkPositions(linkSelection);
        NetworkRenderer.updateNodePositions(nodeSelection);
      });

    NetworkInteractions.attach({
      svg, root, nodeLayer, linkLayer, overlay,
      nodeSelection, linkSelection, simulation, nodesById,
      settings, nodes, width, height,
    });

    return { simulation, nodes, links };
  }

  // Call this if the dashboard re-renders FINAL after a live refresh and
  // you want the graph to pick up new holdings without a full page reload.
  function refresh(containerEl) {
    return mount(containerEl);
  }

  // ---- Resize handling ---------------------------------------------------
  //
  // A full remount on every 'resize' event is disruptive on mobile: iOS
  // Safari fires resize when the address bar collapses/expands on scroll,
  // which would otherwise reset pan/zoom and any open card mid-interaction
  // (this was the cause of expanded cards appearing to "jump" to the
  // corner). We debounce, and only remount when the width actually
  // changed meaningfully — and never while a card is open.
  let resizeTimer = null;
  let lastWidth = null;

  function watchResize(containerEl) {
    lastWidth = containerEl.clientWidth;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = containerEl.clientWidth;
        const isExpanded = !!containerEl.querySelector(".network-node.is-expanded");
        if (!isExpanded && Math.abs(w - lastWidth) > 40) {
          lastWidth = w;
          mount(containerEl);
        }
      }, 300);
    });
  }

  return { mount, refresh, watchResize };
})();
