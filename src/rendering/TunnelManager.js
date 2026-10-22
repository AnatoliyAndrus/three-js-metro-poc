import { CurvePath, Group } from "three";
import { JunctionFactory } from "./JunctionFactory";
import { LodAssembler } from "./LodAssembler";
import { OffsetCurve } from "./OffsetCurve";
import { TunnelFeatureAssembler } from "./TunnelFeatureAssembler";
import {
  createArcLengthChunks,
  createCurve,
  createTunnelCurves,
} from "./render-utils";

/** Coordinates path planning, feature composition, and LOD assembly. */
export class TunnelManager {
  constructor(style) {
    this.style = style;
    this.featureAssembler = new TunnelFeatureAssembler(style);
    this.lodAssembler = new LodAssembler(style.lodLevels);
    this.junctionFactory = new JunctionFactory(style, this.featureAssembler);
  }

  /**
   * @param {import("../domain/Metro").Metro} metro
   * @returns {Group}
   */
  createTunnels(metro) {
    const tunnels = new Group();

    for (const tunnel of metro.tunnels) {
      const curves = createTunnelCurves(tunnel, 0.3);
      const path = new CurvePath();
      curves.forEach((curve) => path.add(curve));

      const chunks = new Group();
      const totalLength = path.getLength();
      for (const chunk of createArcLengthChunks(path, this.style.chunkLength)) {
        const centerU = (chunk.startU + chunk.endU) / 2;
        const center = path.getPointAt(centerU);
        const localCurve = new OffsetCurve(path, center.clone().negate());
        const context = {
          tunnel,
          curve: localCurve,
          worldCurve: path,
          origin: center,
          totalLength,
          ...chunk,
        };

        const lod = this.lodAssembler.create((level) =>
          this.featureAssembler.buildTunnelChunk({
            ...context,
            lodLevel: level.id,
          }),
        );
        lod.position.copy(center);
        chunks.add(lod);
      }

      tunnels.add(chunks);
    }

    for (const metroNode of metro.nodes) {
      if (metroNode.type !== "junction") continue;

      const [curve1, curve2] = this.#createJunctionCurves(metroNode);
      const junctionLod = this.lodAssembler.create((level) =>
        this.junctionFactory.create(curve1, curve2, level.id),
      );
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
        new OffsetCurve(
          createCurve(
            to[0].getGlobalPosition(),
            to[0].getGlobalDirection(),
            from[0].getGlobalDirection().negate(),
            origin,
            0.3,
          ),
          origin.clone().negate(),
        ),
        new OffsetCurve(
          createCurve(
            to[1].getGlobalPosition(),
            to[1].getGlobalDirection(),
            from[0].getGlobalDirection().negate(),
            origin,
            0.3,
          ),
          origin.clone().negate(),
        ),
      ];
    }

    if (from.length === 2 && to.length === 1) {
      const origin = to[0].getGlobalPosition();
      return [
        new OffsetCurve(
          createCurve(
            origin,
            to[0].getGlobalDirection(),
            from[0].getGlobalDirection().negate(),
            from[0].getGlobalPosition(),
            0.3,
          ),
          origin.clone().negate(),
        ),
        new OffsetCurve(
          createCurve(
            origin,
            to[0].getGlobalDirection(),
            from[1].getGlobalDirection().negate(),
            from[1].getGlobalPosition(),
            0.3,
          ),
          origin.clone().negate(),
        ),
      ];
    }

    throw new Error("Invalid port configuration for junction");
  }
}
