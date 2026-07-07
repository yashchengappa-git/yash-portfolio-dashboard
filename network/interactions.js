/*
|--------------------------------------------------------------------------
| Portfolio Network — Interactions
|--------------------------------------------------------------------------
| Owns all user input: hover, click, drag, zoom/pan, expand/collapse.
| Never draws anything directly — always through NetworkRenderer, and
| never picks timings directly — always through NetworkAnimations.
*/

const NetworkInteractions = (() => {

  function attach({ svg, root, nodeLayer, linkLayer, nodeSelection, linkSelection, simulation, nodesById, settings, nodes, width, height }) {

    let expandedId = null;
    let expandedFO = null;

    // ---- helpers ------------------------------------------------------

    function neighborsOf(id) {
      const set = new Set([id]);
      linkSelection.each(function (l) {
        if (l.source.id === id) set.add(l.target.id);
        if (l.target.id === id) set.add(l.source.id);
      });
      return set;
    }

    function applyHover(id) {
      const related = id ? neighborsOf(id) : null;

      nodeSelection.each(function (d) {
        const g = d3.select(this);
        const isRelated = !related || related.has(d.id);
        NetworkAnimations.fadeTo(g, isRelated ? 1 : 0.25, settings.hoverDuration);
        g.select(".network-node-halo").style("opacity", d.id === id ? 0.35 : 0);
        if (d.id === id) {
          NetworkAnimations.growNode(g.select(".network-node-circle"), d.radius * 1.08, settings.hoverDuration);
        } else {
          NetworkAnimations.growNode(g.select(".network-node-circle"), d.radius, settings.hoverDuration);
        }
      });

      linkSelection.each(function (l) {
        const isRelated = !related || (related.has(l.source.id) && related.has(l.target.id));
        NetworkAnimations.strokeTo(d3.select(this), isRelated ? (id ? 0.8 : 0.35) : 0.08, isRelated && id ? 2.2 : 1.4, settings.hoverDuration);
      });
    }

    function collapseExpanded() {
      if (!expandedId) return;
      NetworkRenderer.hideExpandedCard(expandedFO);
      const prevId = expandedId;
      expandedId = null;
      expandedFO = null;
      const g = nodeLayer.select(`g.network-node[data-id="${cssEscape(prevId)}"]`);
      g.classed("is-expanded", false);
      NetworkAnimations.fadeTo(nodeSelection, 1, settings.collapseDuration);
      NetworkAnimations.strokeTo(linkSelection, 0.35, 1.4, settings.collapseDuration);
    }

    function expandNode(d, g) {
      if (expandedId === d.id) return;
      if (expandedId) collapseExpanded();
      expandedId = d.id;
      g.classed("is-expanded", true);
      expandedFO = NetworkRenderer.showExpandedCard(g, d);

      // keep everything else visible but calm, so the card reads clearly
      const related = neighborsOf(d.id);
      nodeSelection.each(function (n) {
        NetworkAnimations.fadeTo(d3.select(this), related.has(n.id) ? 1 : 0.4, settings.expandDuration);
      });
    }

    function cssEscape(id) {
      return String(id).replace(/([^\w-])/g, "\\$1");
    }

    // ---- hover ----------------------------------------------------------

    nodeSelection
      .on("mouseenter", function (event, d) {
        if (expandedId) return; // don't fight the expanded state
        applyHover(d.id);
      })
      .on("mouseleave", function (event, d) {
        if (expandedId) return;
        applyHover(null);
      });

    // ---- click ------------------------------------------------------------

    nodeSelection.on("click", function (event, d) {
      event.stopPropagation();
      const g = d3.select(this);
      if (expandedId === d.id) {
        collapseExpanded();
      } else {
        expandNode(d, g);
      }
    });

    svg.on("click", () => collapseExpanded());

    // ---- drag: temporary displacement, springs back on release ------------

    const drag = d3.drag()
      .on("start", function (event, d) {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function (event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", function (event, d) {
        if (!event.active) simulation.alphaTarget(0);
        // release the pin — forceX/forceY in graph.js will spring it home
        d.fx = null;
        d.fy = null;
      });

    nodeSelection.call(drag);

    // ---- zoom / pan ---------------------------------------------------------
    //
    // Plain mouse-wheel and single-finger touch are left alone (so the page
    // underneath keeps scrolling normally). Zooming requires ctrl/cmd+wheel
    // or a two-finger touch gesture — same convention as Miro/Figma — and
    // dragging the background with a mouse still pans.
    const zoom = d3.zoom()
      .scaleExtent(settings.zoomExtent || [0.35, 2.2])
      .filter(function (event) {
        if (event.type === "wheel") return event.ctrlKey || event.metaKey;
        if (event.type === "touchstart" || event.type === "touchmove") {
          return event.touches && event.touches.length > 1;
        }
        return !event.button;
      })
      .on("zoom", (event) => {
        root.attr("transform", event.transform);
      });

    svg.call(zoom);

    // ---- initial fit-to-view -------------------------------------------------
    //
    // Without this the graph loads at 1:1 scale, which on a typical panel
    // (and especially on mobile) shows only a zoomed-in fragment of it.
    if (nodes && nodes.length && width && height) {
      const pad = 40;
      const xs = nodes.map(n => n.homeX ?? n.x);
      const ys = nodes.map(n => n.homeY ?? n.y);
      const radii = nodes.map(n => n.radius || 20);
      const minX = Math.min(...xs.map((x, i) => x - radii[i])) - pad;
      const maxX = Math.max(...xs.map((x, i) => x + radii[i])) + pad;
      const minY = Math.min(...ys.map((y, i) => y - radii[i])) - pad;
      const maxY = Math.max(...ys.map((y, i) => y + radii[i])) + pad;

      const bboxW = maxX - minX || width;
      const bboxH = maxY - minY || height;
      const fitPadding = settings.initialFitPadding ?? 0.82;
      const [minScale, maxScale] = settings.zoomExtent || [0.35, 2.2];
      let scale = Math.min(width / bboxW, height / bboxH) * fitPadding;
      scale = Math.max(minScale, Math.min(maxScale, scale));

      // Note: the svg's viewBox is set to "-width/2 -height/2 width height"
      // (see graph.js), i.e. (0,0) is already the panel's visual center —
      // so centering the bounding box just means negating its center,
      // with no extra width/2 / height/2 offset.
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const initialTransform = d3.zoomIdentity
        .translate(-cx * scale, -cy * scale)
        .scale(scale);

      svg.call(zoom.transform, initialTransform);
    }

    return { collapseExpanded, zoom };
  }

  return { attach };
})();
