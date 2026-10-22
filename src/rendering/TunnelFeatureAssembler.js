import { TunnelSegment } from "./TunnelSegment";

/**
 * @typedef {Object} TunnelChunkContext
 * @property {import("three").Curve} curve Chunk-local curve view of the full path.
 * @property {import("three").Curve} worldCurve Full path in world coordinates.
 * @property {number} startU Start of the chunk on the full path, normalized to [0, 1].
 * @property {number} endU End of the chunk on the full path, normalized to [0, 1].
 * @property {number} startDistance Start of the chunk in world units.
 * @property {number} endDistance End of the chunk in world units.
 * @property {number} totalLength Full path length in world units.
 * @property {string} lodLevel ID of the requested LOD variant.
 * @property {Object} [junction] Junction context, supplied for junction features.
 */

/** Composes registered features into a generic tunnel segment group. */
export class TunnelFeatureAssembler {
  constructor(style) {
    this.style = style;
  }

  buildSegment(context) {
    const segment = new TunnelSegment(context.curve);

    for (const feature of this.style.segmentFeatures) {
      const object = feature.buildSegment(context);
      segment.addFeature(feature.id, object);
    }

    return segment;
  }

  buildTunnelChunk(context) {
    const chunk = this.buildSegment(context);

    for (const feature of this.style.tunnelFeatures) {
      const object = feature.buildChunk(context);
      chunk.addFeature(feature.id, object);
    }

    return chunk;
  }

  buildJunctionSegment(context) {
    const segment = new TunnelSegment(context.curve);

    for (const feature of this.style.segmentFeatures) {
      const object = feature.buildJunction
        ? feature.buildJunction(context)
        : feature.buildSegment(context);
      segment.addFeature(feature.id, object);
    }

    return segment;
  }
}
