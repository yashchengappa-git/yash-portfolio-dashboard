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

    // Lower spring + higher damping = a node settles back "home" in one
    // smooth motion instead of oscillating past it and bouncing back
    // (that bounce is what reads as a "rubber band" effect).
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
    zoomExtent: [0.35, 2.2],
    initialFitPadding: 0.82,
  },

  themes: [
    {
      id: "ai",
      label: "AI",
      color: "#7DA6FF",
      description:
        "Companies building the models, data infrastructure and platforms that make AI systems usable in production.",
    },
    {
      id: "enterprise",
      label: "Enterprise",
      color: "#F5A35C",
      description:
        "Software businesses riding enterprise digitisation and the shift toward embedding AI into everyday workflows.",
    },
    {
      id: "cybersecurity",
      label: "Cybersecurity",
      color: "#E8757A",
      description:
        "Mission-critical security platforms protecting the infrastructure everything else in this portfolio depends on.",
    },
    {
      id: "semiconductors",
      label: "Semiconductors",
      color: "#6FCF97",
      description:
        "The compute, memory and manufacturing layer underneath the AI buildout — the part nothing above can work without.",
    },
    {
      id: "photonics",
      label: "Photonics",
      color: "#B79CFF",
      description:
        "Optical connectivity and test equipment that move data between GPUs fast enough to keep hyperscale clusters fed.",
    },
    {
      id: "energy",
      label: "Energy",
      color: "#E8C468",
      description:
        "Power generation and grid infrastructure sized for a datacenter buildout that is outpacing available electricity.",
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
    NVDA: "semiconductors",
    MU: "semiconductors",
    AVGO: "semiconductors",
    TSM: "semiconductors",

    NBIS: "ai",
    APLD: "ai",

    COHR: "photonics",
    AAOI: "photonics",
    PENG: "photonics",
    VIAV: "photonics",

    MSFT: "enterprise",
    AMZN: "enterprise",
    NOW: "enterprise",

    CRWD: "cybersecurity",

    GEV: "energy",
    VRT: "energy",
  },

  companyDescriptions: {

    NVDA: {
      title: "NVIDIA",
      overview:
        "Leader in accelerated computing and AI GPUs. Owns the CUDA ecosystem powering modern AI training and inference.",
      thesis:
        "Highest-conviction AI infrastructure holding with a durable software moat on top of hardware leadership.",
      risks: ["AI infrastructure spending slows", "Export restrictions", "Competitive pressure"],
    },

    MU: {
      title: "Micron",
      overview:
        "Memory manufacturer benefiting from demand for HBM in AI servers and a broader memory-pricing recovery.",
      thesis:
        "HBM is a structural requirement for AI GPUs, and Micron is one of three companies globally that can supply it at scale.",
      risks: ["Memory pricing is cyclical", "Customer concentration", "Capex intensity"],
    },

    AVGO: {
      title: "Broadcom",
      overview:
        "Networking silicon, custom AI accelerators (XPUs), and a large infrastructure-software business.",
      thesis:
        "Key AI networking supplier and the custom-silicon partner of choice for hyperscalers who want compute tuned to their own workloads.",
      risks: ["Enterprise software slowdown", "Hyperscaler in-housing", "Integration execution"],
    },

    TSM: {
      title: "TSMC",
      overview:
        "The world's most advanced semiconductor foundry, manufacturing the chips nearly every fabless AI company designs.",
      thesis:
        "A chokepoint position — every NVDA GPU and most custom AI silicon ultimately runs through TSMC's fabs.",
      risks: ["Geopolitical concentration in Taiwan", "Capex cycle", "Advanced-node yield issues"],
    },

    NBIS: {
      title: "Nebius Group",
      overview:
        "AI-focused cloud infrastructure provider, building GPU datacenters for AI training and inference workloads.",
      thesis:
        "A pure-play way to own the 'neocloud' buildout without picking which model or application wins.",
      risks: ["Capital-intensive scaling", "GPU supply dependence", "Competition from hyperscalers"],
    },

    APLD: {
      title: "Applied Digital",
      overview:
        "Builds and operates datacenter capacity, increasingly leased to AI compute and HPC customers.",
      thesis:
        "Levered bet on datacenter capacity being the scarce resource in the AI buildout, not the chips themselves.",
      risks: ["Financing and dilution risk", "Customer concentration", "Execution on build timelines"],
    },

    COHR: {
      title: "Coherent Corp",
      overview:
        "Optical components and lasers used in datacenter interconnects, industrial and telecom applications.",
      thesis:
        "Optical connectivity is the plumbing hyperscale AI clusters need to move data between GPUs fast enough.",
      risks: ["Telecom end-market softness", "Pricing competition", "Integration of past mergers"],
    },

    AAOI: {
      title: "Applied Optoelectronics",
      overview:
        "Designs and manufactures optical transceivers used in datacenter and telecom networks.",
      thesis:
        "Smaller, higher-beta way to play rising datacenter bandwidth needs as clusters scale.",
      risks: ["Customer concentration", "Pricing pressure from larger competitors", "Execution risk on new products"],
    },

    PENG: {
      title: "Penguin Solutions",
      overview:
        "Provides compute infrastructure and memory solutions for AI and high-performance computing customers.",
      thesis:
        "Direct exposure to AI datacenter build-outs through infrastructure hardware rather than any single chip.",
      risks: ["Customer concentration", "Lower margin hardware business", "Cyclicality"],
    },

    VIAV: {
      title: "Viavi Solutions",
      overview:
        "Network test, measurement and optical instrumentation used to build and validate high-speed networks.",
      thesis:
        "A picks-and-shovels play on network buildouts — every optical link that gets deployed needs to be tested.",
      risks: ["Telecom capex cycles", "Smaller-cap liquidity", "Customer spending delays"],
    },

    MSFT: {
      title: "Microsoft",
      overview:
        "Cloud infrastructure (Azure), productivity software, and one of the largest commercial deployers of AI via Copilot.",
      thesis:
        "Diversified way to own enterprise AI adoption without single-product risk, backed by Azure's infrastructure scale.",
      risks: ["Azure capex weighing on margins", "Copilot monetization pace", "Antitrust scrutiny"],
    },

    AMZN: {
      title: "Amazon",
      overview:
        "AWS cloud infrastructure alongside the core e-commerce and advertising businesses.",
      thesis:
        "AWS gives direct exposure to enterprise cloud and AI infrastructure spend, subsidized by a cash-generative retail core.",
      risks: ["Retail margin pressure", "AWS growth deceleration", "Heavy capex"],
    },

    NOW: {
      title: "ServiceNow",
      overview:
        "Workflow automation platform used by large enterprises for IT, HR and customer service processes.",
      thesis:
        "Well positioned to embed AI agents directly into enterprise workflows customers already run through the platform.",
      risks: ["Premium valuation", "Enterprise budget scrutiny", "Competition from point solutions"],
    },

    CRWD: {
      title: "CrowdStrike",
      overview:
        "Cloud-native endpoint and cybersecurity platform protecting enterprise infrastructure.",
      thesis:
        "Security spend is close to non-discretionary, and CrowdStrike's platform approach drives durable land-and-expand growth.",
      risks: ["Competitive intensity in security", "Valuation sensitivity", "Any recurrence of reliability incidents"],
    },

    GEV: {
      title: "GE Vernova",
      overview:
        "Power generation equipment (gas turbines, grid, renewables) spun off from General Electric.",
      thesis:
        "Datacenter power demand is growing faster than grid capacity, and GEV sells the turbines utilities need to catch up.",
      risks: ["Long equipment lead times", "Utility capex cycles", "Execution post-spinoff"],
    },

    VRT: {
      title: "Vertiv",
      overview:
        "Power and thermal management systems (including liquid cooling) for datacenters.",
      thesis:
        "Direct beneficiary of AI datacenters needing far more power density and cooling than traditional facilities.",
      risks: ["Customer concentration in hyperscalers", "Valuation after a strong run", "Supply chain constraints"],
    },
  },

};
