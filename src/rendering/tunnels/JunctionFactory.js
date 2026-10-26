import { Curve, Group } from "three";
import { ShellFeature } from "./features/ShellFeature";
import { TunnelFeatureAssembler } from "./TunnelFeatureAssembler";

export class JunctionFactory {
  /**
   * Junction factory.
   * If both junction branches use same style, pass only featureAssembler1 parameter
   * @param {TunnelFeatureAssembler} featureAssembler1
   * @param {TunnelFeatureAssembler|null} featureAssembler2
   */
  constructor(featureAssembler1, featureAssembler2) {
    this.featureAssembler1 = featureAssembler1;
    this.featureAssembler2 = featureAssembler2 ?? featureAssembler1;

    this.shellFeature1 = this.featureAssembler1.style.segmentFeatures.find((feature) => feature.name === "shell");
    if (!this.shellFeature1 || !(this.shellFeature1 instanceof ShellFeature)) {
      throw new Error("Tunnel style requires a shell feature");
    }

    this.shellFeature2 = this.featureAssembler2.style.segmentFeatures.find((feature) => feature.name === "shell");
    if (!this.shellFeature2 || !(this.shellFeature2 instanceof ShellFeature)) {
      throw new Error("Tunnel style requires a shell feature");
    }
  }

  /**
   * creates junction for given curves.
   * @param {Curve} curve1 First curve of junction. First feature assembler is applied to this branch
   * @param {Curve} curve2 Second curve of junction. Second feature assembler is applied to this branch
   * @param {string} lodLevel
   * @param {object | null} options
   * @returns
   */
  create(curve1, curve2, lodLevel, options = {}) {
    const group = new Group();

    const cutter1 = this.shellFeature1.createCutter(curve1, lodLevel);
    const cutter2 = this.shellFeature2.createCutter(curve2, lodLevel);

    const segment1 = this.featureAssembler1.buildJunctionSegment(curve1, lodLevel, { cutter: cutter2, ...options });
    const segment2 = this.featureAssembler2.buildJunctionSegment(curve2, lodLevel, { cutter: cutter1, verticalOffset: 0.0005, ...options });

    group.add(segment1, segment2);
    return group;
  }
}
