import { BufferGeometry, Curve, Object3D } from "three";
import { createGeometryAlongCurve } from "../tunnel-utils";

/**
 * Holds settings of feature of tunnel with LoD levels
 */
export class Feature {
  name;
  variants;

  constructor({ variants }) {
    this.variants = variants;
  }

  /**
   * Gets LoD variant of feature
   * @param {string} lodLevel
   * @returns {object}
   */
  getVariant(lodLevel) {
    return this.variants?.[lodLevel] ?? null;
  }

  hasVariant(lodLevel) {
    return this.getVariant(lodLevel) != null;
  }

  /**
   *
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Object3D}
   */
  buildSegment(curve, lodLevel, options) {
    throw new Error("Method buildSegment must be implemented in user class");
  }

  /**
   *
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Object3D}
   */
  buildJunction(curve, lodLevel, options) {
    throw new Error("Method buildJunction must be implemented in user class");
  }
}
