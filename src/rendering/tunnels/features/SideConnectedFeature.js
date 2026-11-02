import { Feature } from "./Feature";

/**
 * Connected features represent any feature that is not located directly in tunnel, but rather connects to it from the side, like fire exit or ventilation room
 * They cut out piece of tunnel to connect to it
 */
export class SideConnectedFeature extends Feature {
  isSideConnectedFeature = true;

  /**
   * For given LoD level, creates cutter that would be used to alter other features
   * @param {number} lodLevel
   *
   * @returns {{matrix: Matrix4, u: number}[]}
   */
  createCutter(lodLevel) {
    throw new Error(`Method createCutter must be implemented in feature ${this.name || ""}`);
  }

  /**
   * Method that creates matrices along curve, which represent where to place cutters
   * @param {Curve} curve
   * @param {object} options
   *
   * @returns {{matrix: Matrix4[], u: number}}
   */
  createConnectionMatrices(curve, options) {
    throw new Error(`Method createConnectionMatrices must be implemented in feature ${this.name || ""}`);
  }
}
