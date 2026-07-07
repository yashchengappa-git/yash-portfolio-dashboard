/*
|--------------------------------------------------------------------------
| Portfolio Network — Interactions
|--------------------------------------------------------------------------
| Owns all user input: hover, click, drag, zoom/pan, expand/collapse.
| Never draws anything directly — always through NetworkRenderer, and
| never picks timings directly — always through NetworkAnimations.
*/

const NetworkInteractions = (() => {

  function attach({ svg, root, nodeLayer, linkLayer, overlay, nodeSelection, linkSelection, simulation, nodesById, settings, nodes, width, height }) {

    let expandedId = null;
    let expandedCard = null;

    // ---- helpers ------------------------------------------------------

    function neighborsOf(id) {
      const set = new Set([id]);
      linkSelection.each(function (l) {
        if (l.source.id === id) set.add(l.target.id);
        if (l.target.id === id) set.add(l.source.id);
      });
      return set;
    }

    // Converts a node's data-space (x,y) into pixel coordinates relative to
    // the panel container's top-left corner — i.e. the coordinate space the
    // absolutely-positioned overlay card lives in. Cards are plain HTML
    // elements (not SVG foreignObject) specifically because foreignObject
    // positioning under an animated SVG transform is unreliable on mobile
    // Safari, which was the cause of cards appearing pinned to the corner.
    function nodeScreenPos(d) {
      const t = d3.zoomTransform(svg.node());
      return {
        x: t.x + d.x * t.k + width / 2,
        y: t.y + d.y * t.k + height / 2,
      };
    }

    function repositionExpandedCard() {
      if (!expandedId || !expandedCard) return;
      const d = nodesById[expandedId];
      if (!d) return;
      NetworkRenderer.repositionCard(expandedCard, nodeScreenPos(d), d.type);
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
      NetworkRenderer.hideExpandedCard(expandedCard);
      const prevD = nodesById[expandedId];
      if (prevD) {
        // release the pin we applied while the card was open
        prevD.fx = null;
        prevD.fy = null;
      }
      const g = nodeLayer.select(`g.network-node[data-id="${cssEscape(expandedId)}"]`);
      g.classed("is-expanded", false);
      expandedId = null;
      expandedCard = null;
      NetworkAnimations.fadeTo(nodeSelection, 1, settings.collapseDuration);
      NetworkAnimations.strokeTo(linkSelection, 0.35, 1.4, settings.collapseDuration);
    }

    function expandNode(d, g) {
      if (expandedId === d.id) return;
      if (expandedId) collapseExpanded();
      expandedId = d.id;
      g.classed("is-expanded", true);

      // Pin the node in place while its card is open — otherwise ongoing
      // simulation forces can drift it out from under the card.
      d.fx = d.x;
      d.fy = d.y;

      expandedCard = NetworkRenderer.showExpandedCard(overlay, d, nodeScreenPos(d));

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

    // ---- drag: temporary displacement, settles where you drop it ------------
    //
    // Earlier versions kept pulling every node back toward one fixed "home"
    // position forever, which meant moving a *different* node re-heated the
    // simulation and yanked an already-repositioned node back into the
    // cluster — the "rubber band" effect. Fix: once you drop a node, its
    // dropped position *becomes* its new home, so nothing pulls it back.
    // Neighbours still react naturally via the link/collision forces.

    const drag = d3.drag()
      .on("start", function (event, d) {
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function (event, d) {
        d.fx = event.x;
        d.fy = event.y;
        d.x = event.x;
        d.y = event.y;
        NetworkRenderer.updateNodePositions(nodeSelection);
        NetworkRenderer.updateLinkPositions(linkSelection);
      })
      .on("end", function (event, d) {
        d.homeX = d.fx;
        d.homeY = d.fy;
      });

    nodeSelection.call(drag);

    // ---- zoom / pan ---------------------------------------------------------
    //
    // Plain wheel zooms, with a fixed gentle sensitivity. (d3's default
    // wheelDelta amplifies ctrl/cmd+wheel by 10x — meant for trackpad pinch
    // gestures — which is why requiring ctrl+wheel felt like it "went too
    // far" per scroll tick. A flat, modest multiplier fixes that.)
    // Single-finger touch is left alone so mobile page-scroll still works;
    // two-finger touch pans/zooms the graph.
    const zoom = d3.zoom()
      .scaleExtent(settings.zoomExtent || [0.35, 1.8])
      .wheelDelta((event) => -event.deltaY * (event.deltaMode ? 0.05 : 0.0015))
      .filter(function (event) {
        if (event.type === "touchstart" || event.type === "touchmove") {
          return event.touches && event.touches.length > 1;
        }
        return !event.button;
      })
      .on("zoom", (event) => {
        root.attr("transform", event.transform);
        if (expandedId) repositionExpandedCard();
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
      const [minScale, maxScale] = settings.zoomExtent || [0.35, 1.8];
      let scale = Math.min(width / bboxW, height / bboxH) * fitPadding;
      scale = Math.max(minScale, Math.min(maxScale, scale));

      // Note: the svg's viewBox is "-width/2 -height/2 width height" (see
      // graph.js) — (0,0) is already the panel's visual center — so
      // centering the bounding box just means negating its center.
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const initialTransform = d3.zoomIdentity
        .translate(-cx * scale, -cy * scale)
        .scale(scale);

      svg.call(zoom.transform, initialTransform);
    }

    return { collapseExpanded };
  }

  return { attach };
})();
