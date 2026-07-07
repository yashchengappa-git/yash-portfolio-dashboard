/*
|--------------------------------------------------------------------------
| Portfolio Network — Motion System
|--------------------------------------------------------------------------
| Every animation (fades, node growth, card expansion, link transitions)
| routes through here so timing and easing stay consistent. Nothing in
| this file queries dashboard data or handles input.
*/

const NetworkAnimations = (() => {

  // A gentle overshoot-then-settle curve — reads as "physical" (Miro-like)
  // without being bouncy enough to feel like a toy.
  const springEase = d3.easeBackOut.overshoot(1.15);
  const softEase = d3.easeCubicOut;

  const DURATIONS = {
    hover: 180,
    expand: 450,
    collapse: 350,
    drag: 550,
  };

  function fadeTo(selection, opacity, duration = DURATIONS.hover) {
    return selection.transition("fade").duration(duration).ease(softEase)
      .style("opacity", opacity);
  }

  function growNode(selection, radius, duration = DURATIONS.hover) {
    return selection.transition("grow").duration(duration).ease(springEase)
      .attr("r", radius);
  }

  function moveNode(selection, x, y, duration = DURATIONS.drag) {
    return selection.transition("move").duration(duration).ease(springEase)
      .attr("transform", `translate(${x},${y})`);
  }

  function expandCard(selection, duration = DURATIONS.expand) {
    return selection.transition("expand").duration(duration).ease(springEase)
      .style("opacity", 1)
      .style("transform", "scale(1)");
  }

  function collapseCard(selection, duration = DURATIONS.collapse) {
    return selection.transition("collapse").duration(duration).ease(softEase)
      .style("opacity", 0)
      .style("transform", "scale(0.92)");
  }

  function strokeTo(selection, opacity, width, duration = DURATIONS.hover) {
    return selection.transition("stroke").duration(duration).ease(softEase)
      .style("opacity", opacity)
      .attr("stroke-width", width);
  }

  return {
    DURATIONS,
    springEase,
    softEase,
    fadeTo,
    growNode,
    moveNode,
    expandCard,
    collapseCard,
    strokeTo,
  };
})();
