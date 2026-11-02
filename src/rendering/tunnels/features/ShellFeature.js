import { Curve, DoubleSide, MeshBasicMaterial, Mesh } from "three";
import { getFullProfile, createGeometryAlongCurve } from "../tunnel-utils";
import { Feature } from "./Feature";
import { Brush, Evaluator, HOLLOW_SUBTRACTION } from "three-bvh-csg";

export class ShellFeature extends Feature {
  //shell variant stores profile, resolution, material
  name = "shell";

  constructor({ variants }) {
    super({ variants });
  }
  /**
   * Builds segment of this feature along the curve
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Mesh}
   */
  buildSegment(curve, lodLevel, options = {}) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const geometry = this.#createGeometry(curve, lodLevel, options);

    if (options.sideCutters?.length > 0) {
      const evaluator = new Evaluator();

      let shell = new Brush(geometry, variant.material);
      for (let cutterInfo of options.sideCutters) {
        for (let { matrix } of cutterInfo.points) {
          matrix.decompose(cutterInfo.cutter.position, cutterInfo.cutter.quaternion, cutterInfo.cutter.scale);
          cutterInfo.cutter.updateMatrix();
          cutterInfo.cutter.updateMatrixWorld(true);

          const temp = evaluator.evaluate(shell, cutterInfo.cutter, HOLLOW_SUBTRACTION);
          shell.geometry.dispose();

          shell.geometry = temp.geometry;
        }
      }
      return shell;
    }

    return new Mesh(geometry, variant.material);
  }

  /**
   * Builds part of the shell in junction
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options has to have cutter
   * @returns {Brush} shell
   */
  buildJunction(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const shell = new Brush(this.#createGeometry(curve, lodLevel, options), variant.material);
    return new Evaluator().evaluate(shell, options.cutter, HOLLOW_SUBTRACTION);
  }

  /**
   * Creates cutter brush
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Brush} cutter
   */
  createCutter(curve, lodLevel, options) {
    const cutterGeometry = this.#createGeometry(curve, lodLevel, { ...options, sealedStart: true, sealedEnd: true, tube: true, scale: 0.9999 });
    return new Brush(cutterGeometry, new MeshBasicMaterial({ side: DoubleSide }));
  }

  /**
   * Creates geometry of shell along the curve according to given LoD level
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns
   */
  #createGeometry(curve, lodLevel, options = {}) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    return createGeometryAlongCurve(getFullProfile(variant.profile, options.scale), variant.resolution, curve, options.tube, options.sealedStart, options.sealedEnd, options.startU, options.endU);
  }
}
