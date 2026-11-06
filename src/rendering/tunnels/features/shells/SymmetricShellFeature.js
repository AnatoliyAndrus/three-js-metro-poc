import { Curve, DoubleSide, MeshBasicMaterial, Mesh, BufferGeometry } from "three";
import { getFullProfile, createGeometryAlongCurve } from "../../tunnel-utils";
import { Brush, Evaluator, HOLLOW_SUBTRACTION } from "three-bvh-csg";
import { ShellFeature } from "./ShellFeature";

export class SymmetricShellFeature extends ShellFeature {
  constructor({ variants }) {
    super({ variants });
  }

  buildSegment(curve, lodLevel, options = {}) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const geometry = this.createGeometry(curve, lodLevel, options);

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

  buildJunction(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const shell = new Brush(this.createGeometry(curve, lodLevel, options), variant.material);
    return new Evaluator().evaluate(shell, options.cutter, HOLLOW_SUBTRACTION);
  }

  createCutter(curve, lodLevel, options) {
    const cutterGeometry = this.createGeometry(curve, lodLevel, { ...options, sealedStart: true, sealedEnd: true, tube: true, scale: 0.9999 });
    return new Brush(cutterGeometry, new MeshBasicMaterial({ side: DoubleSide }));
  }

  /**
   * Creates geometry of shell along the curve according to given LoD level
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {BufferGeometry}
   */
  createGeometry(curve, lodLevel, options = {}) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    return createGeometryAlongCurve(getFullProfile(variant.halfProfile, options.scale), variant.resolution, curve, options.tube, options.sealedStart, options.sealedEnd, options.startU, options.endU);
  }
}
