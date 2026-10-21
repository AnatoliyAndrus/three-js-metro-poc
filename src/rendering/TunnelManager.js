import { LOD, Group, CurvePath, Vector2, Material, Mesh } from "three";
import { Metro } from "../domain/Metro";
import { JunctionFactory } from "./JunctionFactory";
import { OffsetCurve } from "./OffsetCurve";
import {
  createTunnelCurves,
  createCurve,
  createGeometryAlongCurve,
} from "./render-utils";

/**
 * Class that manages LOD of tunnels and junctions
 */
export class TunnelManager {
  /**@type {{profile: Vector2[], material: Material}} */
  walkingPath;

  constructor(detailedSegmentFactory, mediumSegmentFactory, lowSegmentFactory) {
    this.detailedSegmentFactory = detailedSegmentFactory;
    this.mediumSegmentFactory = mediumSegmentFactory;
    this.lowSegmentFactory = lowSegmentFactory;

    this.detailedJunctionFactory = new JunctionFactory(
      this.detailedSegmentFactory,
    );
    this.mediumJunctionFactory = new JunctionFactory(this.mediumSegmentFactory);
    this.lowJunctionFactory = new JunctionFactory(this.lowSegmentFactory);
  }

  /**
   *
   * @param {Metro} metro
   * @returns {Group}
   */
  createTunnels(metro) {
    const tunnels = new Group();
    for (const tunnel of metro.tunnels) {
      const segments = new Group();
      const curves = createTunnelCurves(tunnel, 0.3);
      const offsetCurves = curves.map((curve) =>
        new OffsetCurve(curve).offsetToCurveCenter(),
      );

      for (const curve of offsetCurves) {
        const segment = new LOD();

        segment.addLevel(this.detailedSegmentFactory.create(curve), 0);
        segment.addLevel(this.mediumSegmentFactory.create(curve), 50);
        segment.addLevel(this.lowSegmentFactory.create(curve), 100);

        segment.position.copy(curve.offset.clone().negate());
        segments.add(segment);
      }

      if (this.walkingPath) {
        const curvePath = new CurvePath();
        curves.forEach((curve) => curvePath.add(curve));

        const walkingPath = this.#createWalkingPath(curvePath, 0.2, 0.8);
        tunnels.add(walkingPath);
      }

      tunnels.add(segments);
    }

    for (const metroNode of metro.nodes) {
      if (metroNode.type == "junction") {
        const from = [];
        const to = [];
        for (let port of metroNode.ports) {
          if (port.type == "from") {
            from.push(port);
          } else if (port.type == "to") {
            to.push(port);
          }
        }
        //creating curves
        const [curve1, curve2] = (function makeCurves() {
          let curve1, curve2;
          if (from.length === 1 && to.length === 2) {
            curve1 = new OffsetCurve(
              createCurve(
                to[0].getGlobalPosition(),
                to[0].getGlobalDirection(),
                from[0].getGlobalDirection().negate(),
                from[0].getGlobalPosition(),
                0.3,
              ),
              from[0].getGlobalPosition().negate(),
            );
            curve2 = new OffsetCurve(
              createCurve(
                to[1].getGlobalPosition(),
                to[1].getGlobalDirection(),
                from[0].getGlobalDirection().negate(),
                from[0].getGlobalPosition(),
                0.3,
              ),
              from[0].getGlobalPosition().negate(),
            );
          } else if (from.length === 2 && to.length === 1) {
            curve1 = new OffsetCurve(
              createCurve(
                to[0].getGlobalPosition(),
                to[0].getGlobalDirection(),
                from[0].getGlobalDirection().negate(),
                from[0].getGlobalPosition(),
                0.3,
              ),
              to[0].getGlobalPosition().negate(),
            );
            curve2 = new OffsetCurve(
              createCurve(
                to[0].getGlobalPosition(),
                to[0].getGlobalDirection(),
                from[1].getGlobalDirection().negate(),
                from[1].getGlobalPosition(),
                0.3,
              ),
              to[0].getGlobalPosition().negate(),
            );
          } else {
            throw new Error(`Invalid port configuration for junction`);
          }
          return [curve1, curve2];
        })();

        const junctionLOD = new LOD();
        junctionLOD.addLevel(
          this.detailedJunctionFactory.create(curve1, curve2),
          0,
        );
        junctionLOD.addLevel(
          this.mediumJunctionFactory.create(curve1, curve2),
          50,
        );
        junctionLOD.addLevel(
          this.lowJunctionFactory.create(curve1, curve2),
          100,
        );

        junctionLOD.position.copy(curve1.offset.clone().negate());
        tunnels.add(junctionLOD);
      }
    }
    return tunnels;
  }

  /**
   *
   * @param {Curve} curve
   * @param {number} startU
   * @param {number} endU
   */
  #createWalkingPath(curve, startU, endU) {
    const geometry = createGeometryAlongCurve(
      this.walkingPath.profile,
      this.detailedSegmentFactory.shell.resolution,
      curve,
      false,
      true,
      startU,
      endU,
    );
    return new Mesh(geometry, this.walkingPath.material);
  }
}
