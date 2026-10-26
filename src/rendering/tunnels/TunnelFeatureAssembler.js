import { Curve } from "three";
import { Segment } from "./Segment";
import { TunnelStyle } from "./TunnelStyle";

export class TunnelFeatureAssembler {
  /**
   * @param {TunnelStyle} style
   */
  constructor(style) {
    this.style = style;
  }

  /**
   *
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Segment}
   */
  buildSegment(curve, lodLevel, options) {
    const segment = new Segment(curve);

    for (const feature of this.style.segmentFeatures) {
      const object = feature.buildSegment(curve, lodLevel, options);

      segment.addFeature(feature.name, object);
    }

    for (const feature of this.style.tunnelFeatures) {
      const object = feature.buildSegment(curve, lodLevel, options);
      segment.addFeature(feature.name, object);
    }

    return segment;
  }

  /**
   *
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Segment}
   */
  buildJunctionSegment(curve, lodLevel, options) {
    const segment = new Segment(curve);

    for (const feature of this.style.segmentFeatures) {
      const object = feature.buildJunction(curve, lodLevel, options);
      segment.addFeature(feature.name, object);
    }

    return segment;
  }
}
