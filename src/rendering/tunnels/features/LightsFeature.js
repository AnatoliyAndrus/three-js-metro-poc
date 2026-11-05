import { Feature } from "./Feature";
import { getMatricesAlongCurve, isPointInsideMesh } from "../tunnel-utils";
import { Curve } from "three";
import { Lamp } from "../Lamp";
import { Group } from "three";
import { Evaluator } from "three-bvh-csg";

export class LightsFeature extends Feature {
  //light variant stores profilePoint, resolution, casing, light
  name = "lights";

  constructor({ variants, lightPool, lightRenderDistance }) {
    super({ variants });
    this.lightPool = lightPool;
    this.lightRenderDistance = lightRenderDistance;
  }

  buildSegment(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const matrices = getMatricesAlongCurve(variant.profilePoint, variant.resolution, curve, options.startU ?? 0, options.endU ?? 1);
    const lamps = new Group();

    for (const matrix of matrices) {
      const lamp = new Lamp(variant.casing, this.lightPool, this.lightRenderDistance);
      matrix.decompose(lamp.position, lamp.quaternion, lamp.scale);
      lamp.updateMatrix();

      if (options.sideCutters?.length > 0) {
        for (let cutterInfo of options.sideCutters) {
          for (let { matrix } of cutterInfo.points) {
            matrix.decompose(cutterInfo.cutter.position, cutterInfo.cutter.quaternion, cutterInfo.cutter.scale);
            cutterInfo.cutter.updateMatrix();

            if (isPointInsideMesh(lamp.position, cutterInfo.cutter)) lamp.visible = false;
          }
        }
      }

      lamps.add(lamp);
    }

    return lamps;
  }

  /**
   * @param {Curve} curve
   * @param {number} lodLevel
   * @param {object} options holds cutter
   * @returns {Group}
   */
  buildJunction(curve, lodLevel, options = {}) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const matrices = getMatricesAlongCurve(variant.profilePoint, variant.resolution, curve, options.startU ?? 0, options.endU ?? 1, 0);
    const lamps = new Group();

    for (const matrix of matrices) {
      const lamp = new Lamp(variant.casing, this.lightPool, this.lightRenderDistance);
      matrix.decompose(lamp.position, lamp.quaternion, lamp.scale);
      lamp.updateMatrix();

      if (isPointInsideMesh(lamp.position, options.cutter)) {
        lamp.visible = false;
      }

      lamps.add(lamp);
    }

    return lamps;
  }
}
