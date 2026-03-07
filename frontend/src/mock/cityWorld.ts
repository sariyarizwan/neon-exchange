import { districtThemes } from "@/mock/cityThemes";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import type { AvatarOption, Citizen, DistrictZone, NewsstandData, StockNpcProfile, WorldCollider, WorldProp, WorldPropType } from "@/types/world";

const districtZonePresets: Record<
  string,
  {
    width: number;
    height: number;
    streetInset: number;
    tileVariant: DistrictZone["tileVariant"];
  }
> = {
  "chip-docks": { width: 860, height: 620, streetInset: 72, tileVariant: "tech" },
  "bank-towers": { width: 900, height: 660, streetInset: 76, tileVariant: "finance" },
  "energy-yard": { width: 980, height: 700, streetInset: 86, tileVariant: "energy" },
  "industrials-foundry": { width: 920, height: 700, streetInset: 86, tileVariant: "industrial" },
  "consumer-strip": { width: 1120, height: 860, streetInset: 96, tileVariant: "consumer" },
  "crypto-alley": { width: 980, height: 740, streetInset: 88, tileVariant: "crypto" },
  "bio-dome": { width: 920, height: 700, streetInset: 80, tileVariant: "bio" },
  "comms-neon-ridge": { width: 1040, height: 760, streetInset: 92, tileVariant: "comms" }
};

const propSizeByType: Record<WorldPropType, { width: number; height: number }> = {
  "vending-machine": { width: 26, height: 32 },
  "neon-terminal": { width: 24, height: 28 },
  billboard: { width: 54, height: 30 },
  "holo-sign": { width: 30, height: 36 },
  bench: { width: 32, height: 18 },
  crate: { width: 20, height: 20 },
  taxi: { width: 44, height: 22 },
  doorway: { width: 26, height: 34 },
  stairs: { width: 38, height: 18 },
  "palm-tree": { width: 30, height: 42 },
  newsstand: { width: 38, height: 30 },
  "street-lamp": { width: 16, height: 40 },
  "drone-dock": { width: 34, height: 20 },
  manhole: { width: 18, height: 18 },
  "pipe-rack": { width: 52, height: 24 },
  "ac-unit": { width: 26, height: 20 },
  "neon-arrow": { width: 30, height: 18 },
  "server-stack": { width: 38, height: 40 },
  "vault-sign": { width: 46, height: 38 },
  "reactor-core": { width: 42, height: 42 },
  "qr-wall": { width: 58, height: 34 }
};

const buildDistrictZones = () =>
  districts.map((district) => {
    const preset = districtZonePresets[district.id];
    return {
      districtId: district.id,
      x: district.center.x - preset.width / 2,
      y: district.center.y - preset.height / 2,
      width: preset.width,
      height: preset.height,
      streetInset: preset.streetInset,
      accent: district.accent,
      tileVariant: preset.tileVariant
    } satisfies DistrictZone;
  });

export const districtZones = buildDistrictZones();

const zoneById = Object.fromEntries(districtZones.map((zone) => [zone.districtId, zone])) as Record<string, DistrictZone>;

export const avatarOptions: AvatarOption[] = [
  { id: "runner", name: "Runner", body: "#33F5FF", trim: "#E2F4FF", visor: "#0B1020" },
  { id: "broker", name: "Broker", body: "#FF3DF2", trim: "#FFE6FB", visor: "#140A1A" },
  { id: "ghost", name: "Ghost", body: "#B7FF3C", trim: "#F2FFE0", visor: "#0D1510" },
  { id: "volt", name: "Volt", body: "#FFB84D", trim: "#FFF0D9", visor: "#1A1208" },
  { id: "noir", name: "Noir", body: "#7D8BFF", trim: "#EEF1FF", visor: "#10152C" },
  { id: "luxe", name: "Luxe", body: "#FF6CA8", trim: "#FFEAF3", visor: "#2A0E18" }
];

export const stockOutboundUrls = Object.fromEntries(
  tickers.map((ticker) => [ticker.id, `https://example.com/stocks/${ticker.symbol}`])
) as Record<string, string>;

export const newsstands: NewsstandData[] = districts.map((district, index) => {
  const zone = zoneById[district.id];
  const focusTicker = tickers.find((ticker) => ticker.districtId === district.id)?.symbol ?? district.name.slice(0, 4);

  return {
    id: `${district.id}-newsstand`,
    districtId: district.id,
    x: zone.x + zone.streetInset + 74 + (index % 2) * 40,
    y: zone.y + zone.height - zone.streetInset - 58,
    tickerFocus: focusTicker,
    headlines: [
      {
        id: `${district.id}-headline-1`,
        title: `${focusTicker} chatter lights the ${district.name} tape`,
        source: "Mock Wire",
        summary: "Synthetic feeds cluster around late-cycle order flow and watchlist momentum."
      },
      {
        id: `${district.id}-headline-2`,
        title: `${district.sector} corridor sees fresh after-hours interest`,
        source: "Night Desk",
        summary: "Cross-district scanners show related names gaining attention under neon rain."
      },
      {
        id: `${district.id}-headline-3`,
        title: `${focusTicker} alliances ripple toward nearby blocks`,
        source: "Street Scope",
        summary: "Mock linkouts and scenario cards can later be replaced with real market stories."
      },
      {
        id: `${district.id}-headline-4`,
        title: `${district.name} kiosk logs rising citizen traffic`,
        source: "District Bulletin",
        summary: "This booth is structured for future stock-specific news streams and source metadata."
      }
    ]
  };
});

const pushProp = (
  props: WorldProp[],
  districtId: string,
  type: WorldPropType,
  x: number,
  y: number,
  accent: string,
  options: Partial<WorldProp> = {}
) => {
  const size = propSizeByType[type];
  props.push({
    id: `${districtId}-${type}-${props.length}`,
    districtId,
    type,
    x,
    y,
    width: size.width,
    height: size.height,
    accent,
    label: type.replaceAll("-", " "),
    interactive: true,
    collidable: !["manhole", "neon-arrow"].includes(type),
    behavior:
      type === "vending-machine"
        ? "vending"
        : type === "neon-terminal"
          ? "terminal"
          : type === "billboard" || type === "holo-sign" || type === "qr-wall"
            ? "billboard"
            : type === "street-lamp"
              ? "lamp"
              : type === "crate"
                ? "crate"
                : type === "newsstand"
                  ? "newsstand"
                  : ["server-stack", "vault-sign", "reactor-core"].includes(type)
                    ? "landmark"
                    : "none",
    ...options
  });
};

const createDistrictProps = (zone: DistrictZone) => {
  const props: WorldProp[] = [];
  const theme = districtThemes[zone.districtId];
  const insetX = zone.x + zone.streetInset;
  const insetY = zone.y + zone.streetInset;
  const innerWidth = zone.width - zone.streetInset * 2;
  const innerHeight = zone.height - zone.streetInset * 2;
  const accent = zone.accent;

  const lampPoints: Array<[number, number]> = [
    [insetX + 22, insetY + 36],
    [insetX + innerWidth - 38, insetY + 36],
    [insetX + 22, insetY + innerHeight - 46],
    [insetX + innerWidth - 38, insetY + innerHeight - 46]
  ];
  lampPoints.forEach(([x, y]) => pushProp(props, zone.districtId, "street-lamp", x, y, accent, { lightRadius: 78, poi: true }));

  for (let index = 0; index < 4; index += 1) {
    pushProp(props, zone.districtId, "manhole", insetX + 82 + index * 150, insetY + innerHeight / 2 + (index % 2 === 0 ? 84 : -84), accent, {
      interactive: false,
      collidable: false
    });
    pushProp(props, zone.districtId, "ac-unit", insetX + 54 + index * 180, insetY + 70, accent, { interactive: false });
  }

  pushProp(props, zone.districtId, "newsstand", newsstands.find((stand) => stand.districtId === zone.districtId)!.x, newsstands.find((stand) => stand.districtId === zone.districtId)!.y, accent, {
    label: "Newsstand",
    poi: true,
    lightRadius: 54
  });

  const centerY = insetY + innerHeight / 2;
  const decorativeStrip: WorldPropType[] = ["bench", "crate", "neon-terminal", "vending-machine", "neon-arrow", "drone-dock"];
  decorativeStrip.forEach((type, index) => {
    pushProp(props, zone.districtId, type, insetX + 120 + index * 88, centerY + (index % 2 === 0 ? 66 : -66), accent, {
      adFrames: type === "drone-dock" ? ["Dock", "Route", "Idle"] : undefined
    });
  });

  for (let index = 0; index < 10; index += 1) {
    const type = (["crate", "bench", "manhole", "ac-unit", "neon-arrow"] as WorldPropType[])[index % 5];
    pushProp(
      props,
      zone.districtId,
      type,
      insetX + 34 + (index * 76) % Math.max(160, innerWidth - 60),
      insetY + 96 + ((index * 58) % Math.max(140, innerHeight - 120)),
      accent,
      {
        interactive: type !== "manhole" && type !== "ac-unit",
        collidable: type === "crate" || type === "bench"
      }
    );
  }

  for (let lane = 0; lane < 3; lane += 1) {
    for (let index = 0; index < 10; index += 1) {
      const x = insetX + 34 + ((index * 74 + lane * 28) % Math.max(180, innerWidth - 80));
      const y = insetY + 50 + lane * 118 + ((index % 2) * 24);
      const type = (
        [
          "crate",
          "bench",
          "vending-machine",
          "neon-terminal",
          "street-lamp",
          "pipe-rack",
          "ac-unit",
          "neon-arrow",
          "billboard",
          "holo-sign"
        ] as WorldPropType[]
      )[(index + lane) % 10];
      pushProp(props, zone.districtId, type, x, y, accent, {
        interactive: !["ac-unit", "pipe-rack"].includes(type),
        collidable: !["ac-unit", "manhole", "neon-arrow"].includes(type),
        lightRadius:
          type === "street-lamp"
            ? 86
            : type === "billboard" || type === "holo-sign" || type === "vending-machine"
              ? 52
              : undefined,
        poi: type === "billboard" || type === "holo-sign"
      });
    }
  }

  for (let index = 0; index < 8; index += 1) {
    pushProp(props, zone.districtId, "doorway", insetX + 14 + index * 98, zone.y + 58 + (index % 2) * 10, accent, {
      interactive: false,
      collidable: true
    });
    pushProp(props, zone.districtId, "doorway", insetX + innerWidth - 56, insetY + 60 + index * 54, accent, {
      interactive: false,
      collidable: true
    });
  }

  for (let index = 0; index < 6; index += 1) {
    pushProp(props, zone.districtId, "street-lamp", insetX + 72 + index * 118, insetY + innerHeight / 2 - 18, accent, {
      lightRadius: 74,
      poi: index % 2 === 0
    });
    pushProp(props, zone.districtId, "bench", insetX + 86 + index * 118, insetY + innerHeight / 2 + 34, accent, {
      interactive: true,
      collidable: true
    });
  }

  const edgeProps: Array<[WorldPropType, number, number]> = [
    ["billboard", insetX + 10, insetY + 110],
    ["holo-sign", insetX + innerWidth - 54, insetY + 150],
    ["doorway", insetX + innerWidth - 54, insetY + innerHeight / 2 - 24],
    ["stairs", insetX + innerWidth / 2 - 18, insetY + innerHeight - 32],
    ["taxi", insetX + innerWidth / 2 + 90, insetY + innerHeight - 36],
    ["palm-tree", insetX + innerWidth / 2 - 130, insetY + innerHeight - 32],
    ["pipe-rack", insetX + innerWidth - 120, insetY + innerHeight - 60],
    ["vending-machine", insetX + 32, insetY + innerHeight - 40]
  ];
  edgeProps.forEach(([type, x, y]) => pushProp(props, zone.districtId, type, x, y, accent, { poi: type === "billboard" || type === "vending-machine" }));

  if (zone.districtId === "chip-docks") {
    pushProp(props, zone.districtId, "server-stack", insetX + innerWidth / 2 - 22, insetY + innerHeight / 2 - 120, accent, {
      label: theme.landmarkLabel,
      lightRadius: 110,
      poi: true,
      landmarkTitle: "Server Obelisk",
      landmarkText: "A humming holo-obelisk routes synthetic order streams through stacked quantum blades."
    });
    pushProp(props, zone.districtId, "neon-terminal", insetX + innerWidth / 2 + 90, insetY + innerHeight / 2 - 102, accent, { poi: true });
    pushProp(props, zone.districtId, "drone-dock", insetX + innerWidth / 2 - 140, insetY + innerHeight / 2 - 104, accent);
  }

  if (zone.districtId === "bank-towers") {
    pushProp(props, zone.districtId, "vault-sign", insetX + innerWidth / 2 - 20, insetY + innerHeight / 2 - 130, accent, {
      label: theme.landmarkLabel,
      lightRadius: 120,
      poi: true,
      landmarkTitle: "Vault Sign",
      landmarkText: "A polished neon vault glyph flickers over the plaza, reflecting gold on the stone tiles."
    });
    pushProp(props, zone.districtId, "billboard", insetX + innerWidth / 2 + 120, insetY + 112, accent, { poi: true });
  }

  if (zone.districtId === "energy-yard") {
    pushProp(props, zone.districtId, "reactor-core", insetX + innerWidth / 2 - 18, insetY + innerHeight / 2 - 110, accent, {
      label: theme.landmarkLabel,
      lightRadius: 140,
      poi: true,
      landmarkTitle: "Reactor Core",
      landmarkText: "A coil tower and reactor heart spit warning light across the slick pavement."
    });
    pushProp(props, zone.districtId, "pipe-rack", insetX + innerWidth / 2 + 82, insetY + innerHeight / 2 - 118, accent, { poi: true });
    pushProp(props, zone.districtId, "crate", insetX + innerWidth / 2 - 96, insetY + innerHeight / 2 - 34, accent);
  }

  if (zone.districtId === "crypto-alley") {
    pushProp(props, zone.districtId, "qr-wall", insetX + innerWidth / 2 - 34, insetY + innerHeight / 2 - 112, accent, {
      label: theme.landmarkLabel,
      lightRadius: 120,
      poi: true,
      landmarkTitle: "QR Graffiti Wall",
      landmarkText: "Pixel QR tags loop with fake alpha drops, wallet prompts, and alley gossip."
    });
    pushProp(props, zone.districtId, "neon-terminal", insetX + innerWidth / 2 + 84, insetY + innerHeight / 2 - 110, accent, { poi: true });
  }

  if (zone.districtId === "comms-neon-ridge") {
    pushProp(props, zone.districtId, "drone-dock", insetX + innerWidth / 2 - 12, insetY + innerHeight / 2 - 118, accent, {
      label: theme.landmarkLabel,
      lightRadius: 90,
      poi: true,
      landmarkTitle: "Relay Dish",
      landmarkText: "A relay dish tracks offshore signals and sprays ghosted bars across the sky."
    });
    pushProp(props, zone.districtId, "neon-arrow", insetX + innerWidth / 2 + 92, insetY + innerHeight / 2 - 84, accent, { poi: true });
  }

  if (zone.districtId === "industrials-foundry") {
    pushProp(props, zone.districtId, "pipe-rack", insetX + innerWidth / 2 - 26, insetY + innerHeight / 2 - 102, accent, {
      label: theme.landmarkLabel,
      lightRadius: 80,
      poi: true,
      landmarkTitle: "Foundry Crane",
      landmarkText: "A freight crane silhouette and pipe rack dominate the smelter lane."
    });
  }

  if (zone.districtId === "consumer-strip") {
    pushProp(props, zone.districtId, "holo-sign", insetX + innerWidth / 2 - 15, insetY + innerHeight / 2 - 150, accent, {
      label: theme.landmarkLabel,
      lightRadius: 100,
      poi: true,
      landmarkTitle: "Neon Plaza Gate",
      landmarkText: "A glamour gate projects looping sales ads and district quests over the plaza."
    });
    pushProp(props, zone.districtId, "billboard", insetX + innerWidth / 2 + 150, insetY + innerHeight / 2 - 126, accent, { poi: true });
  }

  if (zone.districtId === "bio-dome") {
    pushProp(props, zone.districtId, "street-lamp", insetX + innerWidth / 2 - 8, insetY + innerHeight / 2 - 112, accent, {
      label: theme.landmarkLabel,
      lightRadius: 112,
      poi: true,
      landmarkTitle: "Pulse Garden",
      landmarkText: "Soft bio-lamps and glass planters breathe calm green light into the dome."
    });
  }

  return props;
};

export const cityProps: WorldProp[] = districtZones.flatMap((zone) => createDistrictProps(zone));

export const worldColliders: WorldCollider[] = [
  ...districtZones.flatMap((zone) => {
    const colliders: WorldCollider[] = [];
    const insetX = zone.x + zone.streetInset;
    const insetY = zone.y + zone.streetInset;
    const innerWidth = zone.width - zone.streetInset * 2;
    const innerHeight = zone.height - zone.streetInset * 2;

    for (let index = 0; index < 6; index += 1) {
      colliders.push({
        id: `${zone.districtId}-top-building-${index}`,
        x: insetX + 10 + index * 112,
        y: zone.y + 18,
        width: 78,
        height: 76
      });
    }

    for (let index = 0; index < 4; index += 1) {
      colliders.push({
        id: `${zone.districtId}-right-building-${index}`,
        x: zone.x + zone.width - zone.streetInset - 76,
        y: insetY + 30 + index * 110,
        width: 62,
        height: 82
      });
    }

    colliders.push({
      id: `${zone.districtId}-plaza-core`,
      x: insetX + innerWidth / 2 - 60,
      y: insetY + innerHeight / 2 - 60,
      width: 120,
      height: 120
    });

    return colliders;
  }),
  ...cityProps
    .filter((prop) => prop.collidable)
    .map((prop) => ({
      id: `${prop.id}-collider`,
      x: prop.x - 4,
      y: prop.y - prop.height,
      width: prop.width + 8,
      height: prop.height + 12
    }))
];

const citizenLines = [
  "Storm's coming...",
  "Liquidity's thin tonight.",
  "Newsstand's glowing again.",
  "Keep your stops tight.",
  "Heard the reactor sing?",
  "The tape feels jumpy."
];

export const citizens: Citizen[] = districtZones.flatMap((zone, zoneIndex) =>
  Array.from({ length: zone.districtId === "consumer-strip" ? 8 : 5 }, (_, index) => ({
    id: `${zone.districtId}-citizen-${index}`,
    districtId: zone.districtId,
    x: zone.x + zone.streetInset + 120 + ((index * 91 + zoneIndex * 33) % Math.max(180, zone.width - zone.streetInset * 2 - 140)),
    y: zone.y + zone.streetInset + 110 + ((index * 76 + zoneIndex * 57) % Math.max(180, zone.height - zone.streetInset * 2 - 120)),
    style: (["walker", "vendor", "broker", "runner"] as const)[(index + zoneIndex) % 4],
    color: index % 2 === 0 ? zone.accent : index % 3 === 0 ? "#FF3DF2" : "#B7FF3C",
    patrolRadius: zone.districtId === "consumer-strip" ? 64 : 42,
    dialogues: [citizenLines[(index + zoneIndex) % citizenLines.length], citizenLines[(index + zoneIndex + 2) % citizenLines.length]]
  }))
);

export const pointsOfInterest = cityProps.filter((prop) => prop.poi);

export const stockNpcProfiles: StockNpcProfile[] = tickers.map((ticker, index) => ({
  tickerId: ticker.id,
  patrolRadius: ticker.districtId === "consumer-strip" ? 22 : 14,
  dialogues: [
    `${ticker.symbol} is twitching tonight.`,
    index % 2 === 0 ? "Tape feels electric." : "Watch the next lane pulse."
  ]
}));
