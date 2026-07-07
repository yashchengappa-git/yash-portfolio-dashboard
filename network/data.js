/*
|--------------------------------------------------------------------------
| Portfolio Network — Static Metadata
|--------------------------------------------------------------------------
|
| This file ONLY defines structure and narrative text: themes, which
| theme each ticker belongs to, and the descriptions/thesis/risks shown
| when a node expands.
|
| It intentionally contains NO prices, shares, allocation %, current
| value, gain, or logos — those already exist in index.html's `FINAL`
| array and are read live by graph.js. Duplicating them here would mean
| two sources of truth that drift apart every time the dashboard
| auto-updates.
|
| SELF-HEALING: the dashboard's holdings change over time. If a ticker
| shows up in FINAL that isn't listed in `assignments` below, graph.js
| automatically buckets it into a generic "Other" theme with a fallback
| description, rather than dropping it or breaking. Add a real entry
| here whenever you want to give a new holding its own home.
|
*/

const NETWORK = {

  settings: {
    centralNodeRadius: 42,
    themeRadius: 28,
    stockBaseRadius: 16,
    stockMaxRadius: 44,

    themeDistance: 200,   // distance from Portfolio -> theme nodes
    linkDistance: 110,    // distance from theme -> its company nodes

    // A node's "home" position is where the simulation continuously pulls
    // it back to. Previously that was a single fixed layout slot forever,
    // which is what caused the rubber-band effect — moving one node would
    // re-heat the simulation and yank a *different*, already-repositioned
    // node back to its original slot. Now homeX/Y gets updated to wherever
    // a node is dropped (see interactions.js drag "end"), so this force
    // just gives a gentle settle-in-place rather than a permanent spring back.
    dragSpringStrength: 0.05,
    chargeStrength: -90,
    collidePadding: 6,
    velocityDecay: 0.68,   // simulation friction — higher = less bounce
    alphaDecay: 0.04,      // how fast the sim settles after a release

    hoverDuration: 180,
    expandDuration: 450,
    collapseDuration: 350,

    // How far the graph is allowed to zoom in/out, and how much smaller
    // than a perfect fit the initial view should be (a little breathing
    // room so nothing touches the panel edge on load).
    zoomExtent: [0.35, 1.8],
    initialFitPadding: 0.82,
  },

  themes: [
    {
      id: "Energy & Power Infrastructure",
      label: "Energy & Power Infrastructure",
      color: "#37436E",
      description:
        "The AI buildout has hit a physical wall: you can't run datacenters you can't power and cool. This sleeve owns both sides — grid power and inside-the-room thermal management — selling to hyperscalers with no discretion to delay spending.",
    },
    {
      id: "AI Datacenter Infrastructure",
      label: "AI Datacenter Infrastructure",
      color: "#2E5A47",
      description:
        "Overflow demand from capacity-constrained hyperscalers flows to specialist operators who can deliver purpose-built, GPU-dense facilities faster than retrofitted enterprise space.",
    },
    {
      id: "Cybersecurity",
      label: "Cybersecurity",
      color: "#2A3B52",
      description:
        "AI is expanding the enterprise attack surface faster than legacy tools can track it. Security spend is one of the last enterprise budget lines cut, making it structurally resilient.",
    },
    {
      id: "Semiconductors & Compute",
      label: "Semiconductors & Compute",
      color: "#1F4A4A",
      description:
        "The compute, memory and manufacturing layer underneath the AI buildout — the part nothing above can work without.",
    },
    {
      id: "Photonics & Optical Connectivity",
      label: "Photonics & Optical Connectivity",
      color: "#3E4A2E",
      description:
        "Copper can't carry AI-scale bandwidth between GPUs, servers, and datacenters. This sleeve owns the optical transceiver upgrade cycle (400G → 800G → 1.6T) that AI networking demand is forcing.",
    },
    {
      id: "AI Cloud Infrastructure",
      label: "AI Cloud Infrastructure",
      color: "#3C5259",
      description:
        "The layer where AI workloads are actually built and run — one AI-native specialist and two hyperscalers with balance sheets to keep investing through any demand air-pocket.",
    },
    {
      id: "other",
      label: "Other",
      color: "#9AA0A6",
      description:
        "Positions not yet slotted into a theme. Add them to NETWORK.assignments in network/data.js.",
    },
  ],

  // ticker -> theme id
  assignments: {
    NVDA: "Semiconductors & Compute",
    MU: "Semiconductors & Compute",
    AVGO: "Semiconductors & Compute",
    TSM: "Semiconductors & Compute",
    MRVL: "Semiconductors & Compute",

    NBIS: "AI Cloud Infrastructure",
    APLD: "AI Datacenter Infrastructure",

    COHR: "Photonics & Optical Connectivity",
    AAOI: "Photonics & Optical Connectivity",
    PENG: "Photonics & Optical Connectivity",
    VIAV: "Photonics & Optical Connectivity",

    MSFT: "AI Cloud Infrastructure",
    AMZN: "AI Cloud Infrastructure",

    CRWD: "Cybersecurity",

    GEV: "Energy & Power Infrastructure",
    VRT: "Energy & Power Infrastructure",
  },

  companyDescriptions: {

    NVDA: {
      title: "NVIDIA",
      overview:
        "Dominant AI GPU designer, with the CUDA software ecosystem as its core moat.",
      thesis:
        "Foundation of the sleeve — GPU compute dominance reinforced by switching costs from CUDA. Datacenter revenue has repeatedly surprised to the upside on both training and inference demand. Highest-profile, most-watched name in the AI trade.",
      risks: ["Valuation leaves little room for a growth disappointment", "Customer concentration among hyperscalers simultaneously building competing custom silicon", "Export control/geopolitical exposure (China)"],
    },

    MU: {
      title: "Micron Technology",
      overview:
        "Memory manufacturer (DRAM/NAND) and one of three global suppliers of HBM.",
      thesis:
        "HBM is a structural requirement for AI GPUs, and MU is one of only three qualified suppliers at scale. Broader memory cyclical recovery provides an earnings floor. HBM mix-shift is the incremental growth layer on top.",
      risks: ["Memory pricing is cyclical", "Customer concentration among GPU/XPU makers", "Capex intensity of HBM capacity buildout"],
    },

    AVGO: {
      title: "Broadcom",
      overview:
        "Custom AI silicon (XPU) designer and networking chip maker, with a large enterprise software base (VMware).",
      thesis:
        "Designs purpose-built AI accelerators for hyperscalers who want workload-optimized compute over merchant GPUs. Networking silicon ties GPU clusters together at scale — a second AI leg. Enterprise software provides earnings ballast.",
      risks: ["Customer concentration in a small number of XPU programs.", "Risk of hyperscalers in-housing design or shifting to MRVL.", "Debt/integration risk from acquisition history."],
    },

    TSM: {
      title: "TSMC",
      overview:
        "The world's most advanced semiconductor foundry, manufacturing the chips nearly every fabless AI company designs.",
      thesis:
        "Manufactures essentially every leading-edge AI chip in this portfolio — NVDA GPUs, AVGO and MRVL custom silicon. The foundry chokepoint every other compute position depends on. Sustained process-node leadership underpins pricing power.",
      risks: ["Taiwan geopolitical concentration — largest single risk in the portfolio", "Customer concentration among a handful of fabless clients", "Overseas fab expansion carries execution/margin-dilution risk"],
    },

    NBIS: {
      title: "Nebius Group",
      overview:
        "AI-native cloud infrastructure provider, purpose-built for GPU-dense workloads.",
      thesis:
        "Targets the gap where general-purpose hyperscaler cloud is too expensive or insufficiently optimized for AI workloads. Earliest-stage, most specialized name in the sleeve. Upside depends on that capacity gap staying open.",
      risks: ["Highest execution risk in the sleeve — smallest, least-proven model", "Capital intensity requires continued financing access", "Hyperscalers or other neoclouds could close the gap faster"],
    },

    APLD: {
      title: "Applied Digital",
      overview:
        "Builds and operates next-generation datacenters engineered specifically for GPU-dense AI/HPC workloads.",
      thesis:
        "Captures hyperscaler overflow demand as capacity constraints push workloads to specialist operators. Purpose-built design gives faster time-to-power than retrofits. Highest-risk, highest-asymmetry position in the portfolio — payoff depends on the AI buildout cycle continuing.",
      risks: ["Capital-intensive, reliant on continued external financing", "Customer/contract concentration", "Most exposed name if the AI capex cycle slows"],
    },

    COHR: {
      title: "Coherent Corp",
      overview:
        "Vertically integrated photonics company spanning lasers, components, and finished optical transceivers.",
      thesis:
        "Largest, most diversified name in the sleeve — exposure across datacenter, telecom, and industrial/laser end markets. Vertical integration gives cost and supply advantages pure-plays lack. Lower-beta way to own the optical upgrade cycle.",
      risks: ["Non-datacenter segments can dilute the pure AI-growth story", "Integration risk from acquisition history", "Historically more volatile margins than pure-play peers"],
    },

    AAOI: {
      title: "Applied Optoelectronics",
      overview:
        "Pure-play manufacturer of optical transceivers for datacenter networking.",
      thesis:
        "Sits directly in the 400G-to-800G-to-1.6T upgrade cycle, with revenue almost entirely datacenter-facing. Product roadmap tracks hyperscaler timelines closely. Meaningful operating leverage as volumes scale against a fixed manufacturing base.",
      risks: ["Smaller balance sheet — sensitive to a single lost design win", "Volatile execution history on yields/ramps", "Customer concentration among a few hyperscalers"],
    },

    PENG: {
      title: "Penguin Solutions",
      overview:
        "Smaller, earlier-stage optical networking and infrastructure solutions provider.",
      thesis:
        "Smallest, earliest-stage name in the sleeve — more torque to continued optical demand growth given its size. Asymmetric risk/reward relative to COHR and AAOI.",
      risks: ["Least mature, most speculative name in the sleeve", "Lower liquidity and coverage", "More dependent on a narrow set of design wins"],
    },

    MSFT: {
      title: "Microsoft",
      overview:
        "Cloud (Azure) and enterprise software giant embedding AI (Copilot) across its full product suite.",
      thesis:
        "Azure cloud growth combined with Copilot distribution across Office gives Microsoft an AI reach no competitor matches. Balance sheet and existing enterprise relationships make this the lowest-risk name in the sleeve. Multiple AI monetization paths reduce single-point dependency.",
      risks: ["Enormous Azure capex intensity — monetization must keep pace", "OpenAI partnership dependency carries structural ambiguity", "Regulatory/antitrust scrutiny across jurisdictions"],
    },

    AMZN: {
      title: "Amazon",
      overview:
        "E-commerce and logistics company whose AWS cloud segment is the most profitable in the industry.",
      thesis:
        "AWS is reaccelerating as enterprise AI demand pulls workloads back to cloud. Custom Trainium/Inferentia silicon gives Amazon a cost-structure lever peers without custom chips lack. Core retail business adds diversification and cash flow outside the AI cycle.",
      risks: ["AWS capex competes directly with MSFT/GOOGL for GPU supply and buildout dollars", "Retail segment carries structurally lower margins", "Trainium adoption still needs to prove out at scale vs. NVDA incumbency"],
    },

    MRVL: {
      title: "Marvell Technology",
      overview:
        "Semiconductor company transitioning from broad analog/mixed-signal into custom AI silicon (XPU) and datacenter optical connectivity.",
      thesis:
        "Custom silicon has scaled from near-zero to a meaningful share of data center revenue in a few years, with design wins spanning AWS Trainium, Microsoft Maia, and Google TPU-attach — a broader hyperscaler spread than AVGO's book. Optical DSPs and 800G/1.6T pluggables give it a genuine second AI growth leg. Legacy storage/carrier segments add earnings stability underneath the AI ramp.",
      risks: ["Lumpy revenue recognition tied to program ramp timing", "Direct competitive overlap with AVGO for hyperscaler silicon mandates", "Valuation has re-rated substantially, raising the bar for beats"],
    },

    CRWD: {
      title: "CrowdStrike",
      overview:
        "Cloud-native endpoint and cybersecurity platform protecting enterprise infrastructure.",
      thesis:
        "Platform consolidator taking share from legacy point-solution vendors via high switching costs and a widening modular product suite. Being wrong on security is existential for customers, keeping this a resilient, hard-to-cut budget line. Direct beneficiary of AI-driven threat complexity.",
      risks: ["Valuation prices in a high bar for continued net-new ARR growth", "Trust/reputational risk given the July 2024 outage precedent", "Any recurrence of reliability incidents"],
    },

    GEV: {
      title: "GE Vernova",
      overview:
        "Power generation and electrical equipment company (gas turbines, grid solutions, electrification), spun off from GE in 2024.",
      thesis:
        "Pure-play on the grid side of the AI power bottleneck as utility-scale electricity demand forecasts get revised sharply upward. Gas turbine backlogs now extend years out, giving unusually long revenue visibility. Grid equipment demand is reinforced by a separate, non-AI grid-modernization cycle.",
      risks: ["Long-cycle industrial model — slow order-to-revenue conversion", "Permitting/policy risk on new gas and grid buildout", "Execution risk on turbine delivery and margin ramp"],
    },

    VRT: {
      title: "Vertiv Holdings",
      overview:
        "Precision cooling, power management, and infrastructure equipment provider for datacenters.",
      thesis:
        "Owns the thermal/power layer inside the datacenter at the exact moment GPU rack density has broken legacy air cooling. The shift to liquid cooling is a direct mix-upgrade tailwind, since liquid content value per rack exceeds what it replaces. Sits directly in hyperscaler capex path.",
      risks: ["Customer concentration in hyperscaler capex cycles", "Margin sensitivity to input costs and mix execution", "Valuation has already re-rated on the AI narrative"],
    },
  },

};
