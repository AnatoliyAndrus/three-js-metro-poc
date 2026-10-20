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
   * @param {Curve} curve1
   * @param {Curve} curve2
   * @returns {Group}
   */
  create(curve1, curve2) {
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
      const lights1 = this.segmentFactory.createLights(curve1);
      lights1.children.forEach((child) => {
        if (isPointInsideMesh(child.position, shell2Cutter))
          child.visible = false;
      });
      junctionGroup.add(lights1);

      const lights2 = this.segmentFactory.createLights(curve2);
      lights2.children.forEach((child) => {
        if (isPointInsideMesh(child.position, shell1Cutter))
          child.visible = false;
      });
      junctionGroup.add(lights2);
    }

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
