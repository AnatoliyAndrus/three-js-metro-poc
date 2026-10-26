import { CurvePath, Group } from "three";
import { JunctionFactory } from "./JunctionFactory";
import { LodAssembler } from "./LodAssembler";
import { OffsetCurve } from "../OffsetCurve";
import { TunnelFeatureAssembler } from "./TunnelFeatureAssembler";
import { createCurveSegments, createCurve, createTunnelCurves } from "./tunnel-utils";
import { Metro } from "../../domain/Metro";

/** Coordinates path planning, feature composition, and LOD assembly. */
export class TunnelManager {
  constructor(style) {
    this.style = style;
    this.featureAssembler = new TunnelFeatureAssembler(style);
    this.lodAssembler = new LodAssembler(style.lodLevels);
    this.junctionFactory = new JunctionFactory(this.featureAssembler);
  }

  /**
   * @param {Metro} metro
   * @returns {Group}
   */
  createTunnels(metro) {
    const tunnels = new Group();

    for (const tunnel of metro.tunnels) {
      const curves = createTunnelCurves(tunnel, 0.3);
      const path = new CurvePath();
      curves.forEach((curve) => path.add(curve));

      const segments = new Group();
      for (const segment of createCurveSegments(path, this.style.segmentLength)) {
        const centerU = (segment.startU + segment.endU) / 2;
        const center = path.getPointAt(centerU);
        const localCurve = new OffsetCurve(path, center.clone().negate());
        const options = {
          ...segment,
        };

        const lod = this.lodAssembler.create((level) => this.featureAssembler.buildSegment(localCurve, level, options));
        lod.position.copy(center);
        segments.add(lod);
      }

      tunnels.add(segments);
    }

    for (const metroNode of metro.nodes) {
      if (metroNode.type !== "junction") continue;

      const [curve1, curve2] = this.#createJunctionCurves(metroNode);
      const junctionLod = this.lodAssembler.create((level) => this.junctionFactory.create(curve1, curve2, level));
      junctionLod.position.copy(curve1.offset.clone().negate());
      tunnels.add(junctionLod);
    }

    return tunnels;
  }

  #createJunctionCurves(metroNode) {
    const from = metroNode.ports.filter((port) => port.type === "from");
    const to = metroNode.ports.filter((port) => port.type === "to");

    if (from.length === 1 && to.length === 2) {
      const origin = from[0].getGlobalPosition();
      return [
        new OffsetCurve(createCurve(to[0].getGlobalPosition(), to[0].getGlobalDirection(), from[0].getGlobalDirection().negate(), origin, 0.3), origin.clone().negate()),
        new OffsetCurve(createCurve(to[1].getGlobalPosition(), to[1].getGlobalDirection(), from[0].getGlobalDirection().negate(), origin, 0.3), origin.clone().negate()),
      ];
    }

    if (from.length === 2 && to.length === 1) {
      const origin = to[0].getGlobalPosition();
      return [
        new OffsetCurve(createCurve(origin, to[0].getGlobalDirection(), from[0].getGlobalDirection().negate(), from[0].getGlobalPosition(), 0.3), origin.clone().negate()),
        new OffsetCurve(createCurve(origin, to[0].getGlobalDirection(), from[1].getGlobalDirection().negate(), from[1].getGlobalPosition(), 0.3), origin.clone().negate()),
      ];
    }

    throw new Error("Invalid port configuration for junction");
  }
}
