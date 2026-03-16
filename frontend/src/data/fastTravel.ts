export type FastTravelGate = {
  id: string;
  districtId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetDistrictId: string;
  label: string;
  accent: string;
};

/**
 * District centers and approximate bounding boxes:
 *   chip-docks:          center (630, 570),  ~860x620   accent #33F5FF
 *   bank-towers:         center (1590, 570), ~900x660   accent #FFB84D
 *   energy-yard:         center (2610, 570), ~980x700   accent #B7FF3C
 *   crypto-alley:        center (3670, 570), ~980x740   accent #33F5FF
 *   industrials-foundry: center (660, 1450), ~920x700   accent #7DD3FC
 *   consumer-strip:      center (1760, 1450),~1120x860  accent #FF3DF2
 *   bio-dome:            center (2860, 1450),~920x700   accent #B7FF3C
 *   comms-neon-ridge:    center (3920, 1450),~1040x760  accent #FF3DF2
 *
 * Connections (each needs a gate at both ends):
 *   chip-docks <-> bank-towers
 *   chip-docks <-> industrials-foundry
 *   bank-towers <-> consumer-strip
 *   bank-towers <-> energy-yard
 *   consumer-strip <-> bio-dome
 *   consumer-strip <-> crypto-alley
 *   industrials-foundry <-> bio-dome
 *   energy-yard <-> crypto-alley
 *   crypto-alley <-> comms-neon-ridge
 *   bio-dome <-> comms-neon-ridge
 *   consumer-strip <-> comms-neon-ridge
 */

const W = 42;
const H = 36;

export const fastTravelGates: FastTravelGate[] = [
  // chip-docks <-> bank-towers (horizontal neighbors, top row)
  { id: "ft-chip-bank-a",  districtId: "chip-docks",     x: 960,  y: 540,  width: W, height: H, targetDistrictId: "bank-towers",       label: "To Bank Towers",       accent: "#33F5FF" },
  { id: "ft-chip-bank-b",  districtId: "bank-towers",    x: 1240, y: 540,  width: W, height: H, targetDistrictId: "chip-docks",        label: "To Chip Docks",        accent: "#FFB84D" },

  // chip-docks <-> industrials-foundry (vertical neighbors, left column)
  { id: "ft-chip-ind-a",   districtId: "chip-docks",     x: 620,  y: 830,  width: W, height: H, targetDistrictId: "industrials-foundry", label: "To Industrials Foundry", accent: "#33F5FF" },
  { id: "ft-chip-ind-b",   districtId: "industrials-foundry", x: 650, y: 1140, width: W, height: H, targetDistrictId: "chip-docks",     label: "To Chip Docks",          accent: "#7DD3FC" },

  // bank-towers <-> consumer-strip (vertical neighbors)
  { id: "ft-bank-cons-a",  districtId: "bank-towers",    x: 1580, y: 860,  width: W, height: H, targetDistrictId: "consumer-strip",    label: "To Consumer Strip",    accent: "#FFB84D" },
  { id: "ft-bank-cons-b",  districtId: "consumer-strip", x: 1720, y: 1070, width: W, height: H, targetDistrictId: "bank-towers",       label: "To Bank Towers",       accent: "#FF3DF2" },

  // bank-towers <-> energy-yard (horizontal neighbors, top row)
  { id: "ft-bank-energy-a", districtId: "bank-towers",   x: 1980, y: 560,  width: W, height: H, targetDistrictId: "energy-yard",       label: "To Energy Yard",       accent: "#FFB84D" },
  { id: "ft-bank-energy-b", districtId: "energy-yard",   x: 2200, y: 560,  width: W, height: H, targetDistrictId: "bank-towers",       label: "To Bank Towers",       accent: "#B7FF3C" },

  // consumer-strip <-> bio-dome (horizontal neighbors, bottom row)
  { id: "ft-cons-bio-a",   districtId: "consumer-strip", x: 2260, y: 1440, width: W, height: H, targetDistrictId: "bio-dome",          label: "To Bio Dome",          accent: "#FF3DF2" },
  { id: "ft-cons-bio-b",   districtId: "bio-dome",       x: 2440, y: 1440, width: W, height: H, targetDistrictId: "consumer-strip",    label: "To Consumer Strip",    accent: "#B7FF3C" },

  // consumer-strip <-> crypto-alley (diagonal: consumer-strip bottom-row to crypto-alley top-row)
  { id: "ft-cons-crypto-a", districtId: "consumer-strip", x: 2200, y: 1200, width: W, height: H, targetDistrictId: "crypto-alley",     label: "To Crypto Alley",      accent: "#FF3DF2" },
  { id: "ft-cons-crypto-b", districtId: "crypto-alley",   x: 3300, y: 700,  width: W, height: H, targetDistrictId: "consumer-strip",   label: "To Consumer Strip",    accent: "#33F5FF" },

  // industrials-foundry <-> bio-dome (horizontal neighbors, bottom row)
  { id: "ft-ind-bio-a",    districtId: "industrials-foundry", x: 1080, y: 1440, width: W, height: H, targetDistrictId: "bio-dome",     label: "To Bio Dome",          accent: "#7DD3FC" },
  { id: "ft-ind-bio-b",    districtId: "bio-dome",       x: 2440, y: 1500, width: W, height: H, targetDistrictId: "industrials-foundry", label: "To Industrials Foundry", accent: "#B7FF3C" },

  // energy-yard <-> crypto-alley (horizontal neighbors, top row)
  { id: "ft-energy-crypto-a", districtId: "energy-yard",  x: 3050, y: 560,  width: W, height: H, targetDistrictId: "crypto-alley",     label: "To Crypto Alley",      accent: "#B7FF3C" },
  { id: "ft-energy-crypto-b", districtId: "crypto-alley", x: 3280, y: 560,  width: W, height: H, targetDistrictId: "energy-yard",      label: "To Energy Yard",       accent: "#33F5FF" },

  // crypto-alley <-> comms-neon-ridge (vertical neighbors, right column)
  { id: "ft-crypto-comms-a", districtId: "crypto-alley",     x: 3700, y: 860,  width: W, height: H, targetDistrictId: "comms-neon-ridge", label: "To Comms Neon Ridge", accent: "#33F5FF" },
  { id: "ft-crypto-comms-b", districtId: "comms-neon-ridge", x: 3900, y: 1120, width: W, height: H, targetDistrictId: "crypto-alley",    label: "To Crypto Alley",     accent: "#FF3DF2" },

  // bio-dome <-> comms-neon-ridge (horizontal neighbors, bottom row)
  { id: "ft-bio-comms-a",  districtId: "bio-dome",          x: 3280, y: 1460, width: W, height: H, targetDistrictId: "comms-neon-ridge", label: "To Comms Neon Ridge", accent: "#B7FF3C" },
  { id: "ft-bio-comms-b",  districtId: "comms-neon-ridge",  x: 3460, y: 1460, width: W, height: H, targetDistrictId: "bio-dome",        label: "To Bio Dome",         accent: "#FF3DF2" },

  // consumer-strip <-> comms-neon-ridge (diagonal)
  { id: "ft-cons-comms-a", districtId: "consumer-strip",    x: 2240, y: 1560, width: W, height: H, targetDistrictId: "comms-neon-ridge", label: "To Comms Neon Ridge", accent: "#FF3DF2" },
  { id: "ft-cons-comms-b", districtId: "comms-neon-ridge",  x: 3440, y: 1360, width: W, height: H, targetDistrictId: "consumer-strip",  label: "To Consumer Strip",   accent: "#FF3DF2" },
];
