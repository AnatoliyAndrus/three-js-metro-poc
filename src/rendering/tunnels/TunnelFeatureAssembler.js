import { Curve } from "three";
import { Segment } from "./Segment";
import { TunnelStyle } from "./TunnelStyle";
import { ShellFeature } from "./features/ShellFeature";

export class TunnelFeatureAssembler {
  /**
   * @param {TunnelStyle} style
   */
  constructor(style) {
    this.style = style;

    this.shellFeature = this.style.segmentFeatures.find((feature) => feature.name === "shell");
    if (!this.shellFeature || !(this.shellFeature instanceof ShellFeature)) {
      throw new Error("Tunnel style requires a shell feature");
    }
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
    options = { ...options };

    const dU = options.endU - options.startU;
    //some features, such as fire exits, require to cut other segment features, therefore cutters and places, where to put them, are passed into options.
    //for now, for creating cutters, part that is checked is a little bit longer than segment, so that connections that are located directly between two segments don't break.
    const sideCutters = this.style.tunnelFeatures
      .filter((feature) => feature.hasVariant(lodLevel) && feature.isSideConnectedFeature)
      .map((feature) => {
        return {
          feature: feature,
          cutter: feature.createCutter(lodLevel),
          points: feature.createConnectionMatrices(curve, { startU: Math.max(0, options.startU - 0.1 * dU), endU: Math.min(1, options.endU + 0.1 * dU) }),
        };
      });

    options.shellCutterSelf = this.shellFeature.createCutter(curve, lodLevel, { ...options, startU: Math.max(0, options.startU - 0.1 * dU), endU: Math.min(1, options.endU + 0.1 * dU) });
    options.sideCutters = sideCutters;

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
