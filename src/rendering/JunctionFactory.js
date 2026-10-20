import { MetroNode } from "../domain/MetroNode";
import { TunnelSegmentFactory } from "./TunnelSegmentFactory";
import { HOLLOW_SUBTRACTION, Brush, Evaluator } from "three-bvh-csg";
import {
  createCurve,
  createGeometryAlongCurve,
  isPointInsideMesh,
} from "./render-utils";
import { Curve, Vector3, Group, Mesh, DoubleSide } from "three";
import { OffsetCurve } from "./OffsetCurve";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MeshBasicMaterial } from "three";

export class JunctionFactory {
  segmentFactory;
  /**
   * @param {TunnelSegmentFactory} segmentFactory
   */
  constructor(segmentFactory) {
    if (!segmentFactory.shell)
      throw new Error("Tunnel segment factory must have shells");
    this.segmentFactory = segmentFactory;
  }

  /**
   * @param {MetroNode} junction data representation
   * @returns {Group}
   */
  create(junction) {
    if (junction.type != "junction") throw new Error("Node has to be junction");

    const from = [];
    const to = [];
    for (let port of junction.ports) {
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
          ),
          from[0].getGlobalPosition().negate(),
        );
        curve2 = new OffsetCurve(
          createCurve(
            to[1].getGlobalPosition(),
            to[1].getGlobalDirection(),
            from[0].getGlobalDirection().negate(),
            from[0].getGlobalPosition(),
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
          ),
          to[0].getGlobalPosition().negate(),
        );
        curve2 = new OffsetCurve(
          createCurve(
            to[0].getGlobalPosition(),
            to[0].getGlobalDirection(),
            from[1].getGlobalDirection().negate(),
            from[1].getGlobalPosition(),
          ),
          to[0].getGlobalPosition().negate(),
        );
      } else {
        throw new Error(`Invalid port configuration for junction`);
      }
      return [curve1, curve2];
    })();

    const junctionGroup = new Group();

    const shell1Brush = new Brush(
      this.segmentFactory.createShellGeometry(curve1),
      this.segmentFactory.shell.material,
    );
    const shell2Brush = new Brush(
      this.segmentFactory.createShellGeometry(curve2),
      this.segmentFactory.shell.material,
    );
    const cutterMaterial = new MeshBasicMaterial({ side: DoubleSide });
    const cutter1Geometry = this.segmentFactory.createShellGeometry(
      curve1,
      0.99999,
      true,
    );
    const shell1Cutter = new Brush(cutter1Geometry, cutterMaterial);
    const cutter2Geometry = this.segmentFactory.createShellGeometry(
      curve2,
      0.99999,
      true,
    );
    const shell2Cutter = new Brush(cutter2Geometry, cutterMaterial);

    const evaluator = new Evaluator();
    const shell1 = evaluator.evaluate(
      shell1Brush,
      shell2Cutter,
      HOLLOW_SUBTRACTION,
    );
    const shell2 = evaluator.evaluate(
      shell2Brush,
      shell1Cutter,
      HOLLOW_SUBTRACTION,
    );
    junctionGroup.add(shell1, shell2);

    if (this.segmentFactory.floor) {
      junctionGroup.add(this.#createFloor(curve1, curve2));
    }

    if (this.segmentFactory.sleepers) {
      junctionGroup.add(this.segmentFactory.createSleepers(curve1));
      junctionGroup.add(this.segmentFactory.createSleepers(curve2));
    }

    if (this.segmentFactory.rails) {
      junctionGroup.add(...this.segmentFactory.createRails(curve1));
      junctionGroup.add(...this.segmentFactory.createRails(curve2));
    }

    if (this.segmentFactory.lights) {
      const lights1 = this.segmentFactory.createLights(
        curve1,
        this.segmentFactory.lights.lod,
      );
      lights1.children.forEach((child) => {
        if (isPointInsideMesh(child.position, shell2Cutter))
          child.visible = false;
      });
      junctionGroup.add(lights1);

      const lights2 = this.segmentFactory.createLights(
        curve2,
        this.segmentFactory.lights.lod,
      );
      lights2.children.forEach((child) => {
        if (isPointInsideMesh(child.position, shell1Cutter))
          child.visible = false;
      });
      junctionGroup.add(lights2);
    }

    junctionGroup.position.copy(curve1.offset.clone().negate());
    return junctionGroup;
  }

  #createFloor(curve1, curve2) {
    const floorGeometry = mergeGeometries([
      this.segmentFactory.createFloorGeometry(curve1),
      this.segmentFactory.createFloorGeometry(curve2),
    ]);
    return new Mesh(floorGeometry, this.segmentFactory.floor.material);
  }
}
