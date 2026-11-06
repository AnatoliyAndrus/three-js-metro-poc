import { Curve, DoubleSide, MeshBasicMaterial, Mesh } from "three";
import { getFullProfile, createGeometryAlongCurve } from "../../tunnel-utils";
import { Feature } from "../Feature";
import { Brush, Evaluator, HOLLOW_SUBTRACTION } from "three-bvh-csg";

/**
 * Interface for different shell features
 */
export class ShellFeature extends Feature {
  name = "shell";

  constructor({ variants }) {
    super({ variants });
  }

  /**
   * Creates cutter brush
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Brush} cutter
   */
  createCutter(curve, lodLevel, options) {
    throw new Error("Method 'createCutter' be implemented");
  }
}
