import { CurvePath, Group, Vector3 } from "three";
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
      segments.userData.curve = path;
      tunnels.add(segments);
    }

    for (const metroNode of metro.nodes) {
      if (metroNode.type !== "junction") continue;

      const [config1, config2] = this.#createJunctionConfigs(metroNode);
      const junctionLod = this.lodAssembler.create((level) => this.junctionFactory.create(config1, config2, level));
      junctionLod.position.copy(config1.curve.offset.clone().negate());
      tunnels.add(junctionLod);
    }

    return tunnels;
  }

  #createJunctionConfigs(metroNode) {
    const from = metroNode.ports.filter((port) => port.type === "from");
    const to = metroNode.ports.filter((port) => port.type === "to");

    if (from.length === 1 && to.length === 2) {
      const origin = from[0].getGlobalPosition();
      const firstLeft = isLeft(to[1].localPosition, from[0].localPosition, to[0].localPosition);
      const config1 = {
        to: to[0],
        from: from[0],
        curve: new OffsetCurve(createCurve(to[0].getGlobalPosition(), to[0].getGlobalDirection(), from[0].getGlobalDirection().negate(), origin, 0.3), origin.clone().negate()),
        isLeft: firstLeft,
      };
      const config2 = {
        to: to[1],
        from: from[0],
        curve: new OffsetCurve(createCurve(to[1].getGlobalPosition(), to[1].getGlobalDirection(), from[0].getGlobalDirection().negate(), origin, 0.3), origin.clone().negate()),
        isLeft: !firstLeft,
      };
      return [config1, config2];
    }

    if (from.length === 2 && to.length === 1) {
      const origin = to[0].getGlobalPosition();
      const firstLeft = isLeft(to[0].localPosition, from[1].localPosition, from[0].localPosition);
      const config1 = {
        to: to[0],
        from: from[0],
        curve: new OffsetCurve(createCurve(origin, to[0].getGlobalDirection(), from[0].getGlobalDirection().negate(), from[0].getGlobalPosition(), 0.3), origin.clone().negate()),
        isLeft: firstLeft,
      };
      const config2 = {
        to: to[0],
        from: from[1],
        curve: new OffsetCurve(createCurve(origin, to[0].getGlobalDirection(), from[1].getGlobalDirection().negate(), from[1].getGlobalPosition(), 0.3), origin.clone().negate()),
        isLeft: !firstLeft,
      };
      return [config1, config2];
    }

    throw new Error("Invalid port configuration for junction");
  }
}

/**
 * returns true if point c is left relative to segment ab. Disregards y coordinate
 * @param {Vector3} a
 * @param {Vector3} b
 * @param {Vector3} c
 * @returns {boolean}
 */
function isLeft(a, b, c) {
  const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);

  return cross < 0;
}
