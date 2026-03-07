import type { DistrictTheme } from "@/types/world";

export const districtThemes: Record<string, DistrictTheme> = {
  "chip-docks": {
    districtId: "chip-docks",
    icon: "⌁",
    questHint: "Visit the holo obelisk and tap a tech terminal.",
    ambientDust: 18,
    stormRain: 0.42,
    landmarkId: "chip-docks-landmark",
    landmarkLabel: "Server Obelisk"
  },
  "bank-towers": {
    districtId: "bank-towers",
    icon: "⬢",
    questHint: "Check the neon vault sign and the district newsstand.",
    ambientDust: 12,
    stormRain: 0.34,
    landmarkId: "bank-towers-landmark",
    landmarkLabel: "Vault Sign"
  },
  "energy-yard": {
    districtId: "energy-yard",
    icon: "⚡",
    questHint: "Inspect the reactor core before the next storm pulse.",
    ambientDust: 10,
    stormRain: 0.8,
    landmarkId: "energy-yard-landmark",
    landmarkLabel: "Reactor Core"
  },
  "industrials-foundry": {
    districtId: "industrials-foundry",
    icon: "▣",
    questHint: "Look for moving freight and a glowing pipe rack.",
    ambientDust: 15,
    stormRain: 0.46,
    landmarkId: "industrials-foundry-landmark",
    landmarkLabel: "Foundry Crane"
  },
  "consumer-strip": {
    districtId: "consumer-strip",
    icon: "✦",
    questHint: "Visit the newsstand to see today's headline.",
    ambientDust: 16,
    stormRain: 0.38,
    landmarkId: "consumer-strip-landmark",
    landmarkLabel: "Neon Plaza Gate"
  },
  "crypto-alley": {
    districtId: "crypto-alley",
    icon: "◎",
    questHint: "Scan the QR wall and hit the plugin stock prompt.",
    ambientDust: 14,
    stormRain: 0.58,
    landmarkId: "crypto-alley-landmark",
    landmarkLabel: "QR Graffiti Wall"
  },
  "bio-dome": {
    districtId: "bio-dome",
    icon: "◌",
    questHint: "Check the bio lamp garden and the newsstand terminal.",
    ambientDust: 9,
    stormRain: 0.4,
    landmarkId: "bio-dome-landmark",
    landmarkLabel: "Pulse Garden"
  },
  "comms-neon-ridge": {
    districtId: "comms-neon-ridge",
    icon: "⌘",
    questHint: "Find the relay dish and follow the neon arrows.",
    ambientDust: 13,
    stormRain: 0.52,
    landmarkId: "comms-neon-ridge-landmark",
    landmarkLabel: "Relay Dish"
  }
};
