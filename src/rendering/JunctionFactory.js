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
import { TunnelSegment } from "./TunnelSegment";

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
    const segment1 = new TunnelSegment();
    const segment2 = new TunnelSegment();

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
    segment1.addShell(shell1);
    segment2.addShell(shell2);

    if (this.segmentFactory.floor) {
      segment1.addFloor(this.segmentFactory.createFloor(curve1));
      //moving second floor a little bit so they don't overlap
      const floor2 = this.segmentFactory.createFloor(curve2);
      floor2.position.y += 0.0005;
      segment2.addFloor(floor2);
    }

    if (this.segmentFactory.sleepers) {
      segment1.addSleepers(this.segmentFactory.createSleepers(curve1));
      segment2.addSleepers(this.segmentFactory.createSleepers(curve2));
    }

    if (this.segmentFactory.rails) {
      segment1.addRails(this.segmentFactory.createRails(curve1));
      segment2.addRails(this.segmentFactory.createRails(curve2));
    }

    if (this.segmentFactory.lights) {
      const lights1 = this.segmentFactory.createLights(curve1);
      lights1.children.forEach((child) => {
        if (isPointInsideMesh(child.position, shell2Cutter))
          child.visible = false;
      });
      segment1.addLights(lights1);

      const lights2 = this.segmentFactory.createLights(curve2);
      lights2.children.forEach((child) => {
        if (isPointInsideMesh(child.position, shell1Cutter))
          child.visible = false;
      });
      segment2.addLights(lights2);
    }

    segment1.curve = curve1;
    segment2.curve = curve2;
    const junctionGroup = new Group();
    junctionGroup.add(segment1, segment2);
    return junctionGroup;
  }
}
