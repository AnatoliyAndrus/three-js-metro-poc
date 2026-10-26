import { Feature } from "./Feature";
import { getMatrixesAlongCurve, isPointInsideMesh } from "../tunnel-utils";
import { Curve } from "three";
import { Lamp } from "../Lamp";
import { Group } from "three";

export class LightsFeature extends Feature {
  //light variant stores profilePoint, resolution, casing, light
  name = "lights";

  constructor({ variants }) {
    super({ variants });
  }

  buildSegment(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const matrices = getMatrixesAlongCurve(variant.profilePoint, variant.resolution, curve, options.startU ?? 0, options.endU ?? 1);
    const lamps = new Group();

    for (const matrix of matrices) {
      const lamp = new Lamp(variant.casing, variant.light);
      matrix.decompose(lamp.position, lamp.quaternion, lamp.scale);
      lamp.updateMatrix();

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

    const matrices = getMatrixesAlongCurve(variant.profilePoint, variant.resolution, curve, options.startU ?? 0, options.endU ?? 1, 0);
    const lamps = new Group();

    for (const matrix of matrices) {
      const lamp = new Lamp(variant.casing, variant.light);
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
