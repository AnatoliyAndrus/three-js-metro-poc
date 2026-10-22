const DEFAULT_LOD_LEVELS = [
  { id: "detailed", distance: 0 },
  { id: "medium", distance: 50 },
  { id: "low", distance: 100 },
];

/**
 * A reusable description of the visual style and LOD policy for a tunnel.
 * Features are definitions; their build methods create the per-chunk objects.
 */
export class TunnelStyle {
  constructor({
    segmentFeatures = [],
    tunnelFeatures = [],
    lodLevels = DEFAULT_LOD_LEVELS,
    chunkLength = 25,
  } = {}) {
    if (!(chunkLength > 0)) {
      throw new Error("Tunnel chunkLength must be greater than zero");
    }

    if (!Array.isArray(lodLevels) || lodLevels.length === 0) {
      throw new Error("TunnelStyle requires at least one LOD level");
    }

    const ids = new Set();
    for (const feature of segmentFeatures) {
      if (!feature?.id) throw new Error("Every tunnel feature must have an id");
      if (typeof feature.buildSegment !== "function") {
        throw new Error(
          `Segment feature '${feature.id}' must implement buildSegment`,
        );
      }
      if (ids.has(feature.id)) {
        throw new Error(`Duplicate tunnel feature id: ${feature.id}`);
      }
      ids.add(feature.id);
    }

    for (const feature of tunnelFeatures) {
      if (!feature?.id) throw new Error("Every tunnel feature must have an id");
      if (typeof feature.buildChunk !== "function") {
        throw new Error(
          `Tunnel feature '${feature.id}' must implement buildChunk`,
        );
      }
      if (ids.has(feature.id)) {
        throw new Error(`Duplicate tunnel feature id: ${feature.id}`);
      }
      ids.add(feature.id);
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
    this.chunkLength = chunkLength;
  }
}
