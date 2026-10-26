import { Feature } from "./features/Feature";

const DEFAULT_LOD_LEVELS = [
  { id: "detailed", distance: 0 },
  { id: "medium", distance: 50 },
  { id: "low", distance: 100 },
];

export class TunnelStyle {
  /**@type {Feature[]} */
  segmentFeatures;
  /**@type {Feature[]} */
  tunnelFeatures;

  constructor({ segmentFeatures = [], tunnelFeatures = [], lodLevels = DEFAULT_LOD_LEVELS, segmentLength = 25 } = {}) {
    if (!(segmentLength > 0)) {
      throw new Error("Tunnel segmentLength must be greater than zero");
    }

    if (!Array.isArray(lodLevels) || lodLevels.length === 0) {
      throw new Error("TunnelStyle requires at least one LOD level");
    }

    const levelIds = new Set();
    for (let i = 0; i < lodLevels.length; i++) {
      const level = lodLevels[i];
      if (!level?.id || !(level.distance >= 0)) {
        throw new Error("Each LOD level needs an id and non-negative distance");
      }
      if (levelIds.has(level.id)) {
        throw new Error(`Duplicate LOD level id: ${level.id}`);
      }
      levelIds.add(level.id);
      if (i > 0 && level.distance < lodLevels[i - 1].distance) {
        throw new Error("LOD levels must be ordered by increasing distance");
      }
    }
    if (lodLevels[0].distance !== 0) {
      throw new Error("The first LOD level must start at distance zero");
    }

    this.segmentFeatures = [...segmentFeatures];
    this.tunnelFeatures = [...tunnelFeatures];
    this.lodLevels = lodLevels.map((level) => ({ ...level }));
    this.segmentLength = segmentLength;
  }
}
