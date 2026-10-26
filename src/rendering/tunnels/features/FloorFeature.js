import { Feature } from "./Feature";
import { createGeometryAlongCurve } from "../tunnel-utils";
import { Mesh } from "three";

export class FloorFeature extends Feature {
  //floor variant stores profile, resolution, material
  name = "floor";

  constructor({ profile, variants }) {
    super({ variants });
    this.profile = profile;
  }

  /**
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Mesh}
   */
  buildSegment(curve, lodLevel, options = {}) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const geometry = createGeometryAlongCurve(this.profile, variant.resolution, curve, false, false, false, options.startU, options.endU);
    return new Mesh(geometry, variant.material);
  }

  /**
   *
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Mesh}
   */
  buildJunction(curve, lodLevel, options = {}) {
    if (!this.hasVariant(lodLevel)) return null;

    const floor = this.buildSegment(curve, lodLevel, options);
    floor.position.y += options.verticalOffset ?? 0;
    return floor;
  }
}
