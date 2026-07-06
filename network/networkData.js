/*
|--------------------------------------------------------------------------
| Portfolio Network Configuration
|--------------------------------------------------------------------------
|
| This file ONLY defines the structure of the graph.
| Holdings, weights, prices and logos are pulled from the dashboard.
|
*/

const NETWORK = {

    settings: {

        centralNodeRadius: 42,

        themeRadius: 28,

        stockBaseRadius: 18,

        stockMaxRadius: 42,

        linkDistance: 150,

        themeDistance: 190,

        dragDamping: 0.18,

        animationDuration: 450

    },



    themes: [

        {

            id: "ai",

            label: "AI",

            color: "#3B82F6",

            description:
                "Companies building AI infrastructure, compute and supporting technologies."

        },

        {

            id: "enterprise",

            label: "Enterprise",

            color: "#F97316",

            description:
                "Software businesses benefiting from enterprise digitisation and AI adoption."

        },

        {

            id: "cybersecurity",

            label: "Cybersecurity",

            color: "#EF4444",

            description:
                "Mission critical security platforms protecting modern infrastructure."

        },

        {

            id: "semiconductors",

            label: "Semiconductors",

            color: "#22C55E",

            description:
                "Chip manufacturers supplying AI compute, memory and networking."

        },

        {

            id: "photonics",

            label: "Photonics",

            color: "#8B5CF6",

            description:
                "Optical connectivity enabling hyperscale AI clusters."

        },

        {

            id: "energy",

            label: "Energy",

            color: "#EAB308",

            description:
                "Power infrastructure supporting the AI datacenter buildout."

        }

    ],



    assignments: {

        MSFT: "enterprise",

        AMZN: "enterprise",

        NOW: "enterprise",

        CRWD: "cybersecurity",

        NVDA: "semiconductors",

        MU: "semiconductors",

        AVGO: "semiconductors",

        TSM: "semiconductors",

        NBIS: "ai",

        APLD: "ai",

        COHR: "photonics",

        AAOI: "photonics",

        PENG: "photonics",

        GEV: "energy",

        VRT: "energy"

    },



    companyDescriptions: {

        NVDA: {

            title: "NVIDIA",

            overview:
                "Leader in accelerated computing and AI GPUs. Owns the CUDA ecosystem powering modern AI training and inference.",

            thesis:
                "Highest conviction AI infrastructure holding with durable competitive advantages.",

            risks: [
                "AI infrastructure spending slows",
                "Export restrictions",
                "Competitive pressure"
            ]

        },

        MU: {

            title: "Micron",

            overview:
                "Memory manufacturer benefiting from demand for HBM and AI servers.",

            thesis:
                "HBM demand provides structural earnings growth.",

            risks: [
                "Memory cycles",
                "Pricing volatility"
            ]

        },

        AVGO: {

            title: "Broadcom",

            overview:
                "Networking, custom silicon and infrastructure software.",

            thesis:
                "Key AI networking supplier with diversified cash flows.",

            risks: [
                "Enterprise slowdown",
                "Integration execution"
            ]

        }

        // We'll complete every company later.
        // The graph will still work while we build.

    }

};
