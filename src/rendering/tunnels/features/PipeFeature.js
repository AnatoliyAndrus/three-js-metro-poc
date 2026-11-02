import { Curve, Object3D, Group, Mesh, Matrix4, Vector3 } from "three";
import { createGeometryAlongCurve, createInstancesAlongCurve, isPointInsideMesh } from "../tunnel-utils";
import { Feature } from "./Feature";
import { Evaluator, SUBTRACTION, Brush } from "three-bvh-csg";

/**
 */
export class PipeFeature extends Feature {
  name = "pipe";

  constructor({ variants, isLeft = true, profile, offset }) {
    super({ variants });

    this.isLeft = isLeft;
    this.offset = offset;
    this.profile = profile.map((point) => point.clone().add(offset));
    this.variants = variants;
  }

  /**
   *
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Object3D}
   */
  buildSegment(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const group = new Group();

    let fasteners;
    if (variant.fastener) {
      fasteners = createInstancesAlongCurve(this.offset, variant.fastener.geometry, variant.fastener.material, variant.fastener.resolution, curve, options.startU ?? 0, options.endU ?? 1);
      group.add(fasteners);
    }

    const geometry = createGeometryAlongCurve(this.profile, variant.resolution, curve, true, true, true, options.startU ?? 0, options.endU ?? 1);

    let pipe;
    if (options.sideCutters?.length > 0) {
      const evaluator = new Evaluator();

      pipe = new Brush(geometry, variant.material);
      for (let cutterInfo of options.sideCutters) {
        for (let { matrix } of cutterInfo.points) {
          matrix.decompose(cutterInfo.cutter.position, cutterInfo.cutter.quaternion, cutterInfo.cutter.scale);
          cutterInfo.cutter.updateMatrix();
          cutterInfo.cutter.updateMatrixWorld(true);

          const temp = evaluator.evaluate(pipe, cutterInfo.cutter, SUBTRACTION);
          pipe.geometry.dispose();
          pipe.geometry = temp.geometry;

          if (fasteners) {
            for (let i = 0; i < fasteners.count; i++) {
              const instanceMatrix = new Matrix4();
              fasteners.getMatrixAt(i, instanceMatrix);
              let position = new Vector3(instanceMatrix.elements[12], instanceMatrix.elements[13], instanceMatrix.elements[14]);
              if (isPointInsideMesh(position, cutterInfo.cutter)) {
                instanceMatrix.makeScale(0, 0, 0);
                fasteners.setMatrixAt(i, instanceMatrix);
                fasteners.instanceMatrix.needsUpdate = true;
              }
            }
          }
        }
      }
      group.add(pipe);
      return group;
    }

    pipe = new Mesh(geometry, variant.material);
    group.add(pipe);
    return group;
  }

  /**
   *
   * @param {Curve} curve
   * @param {string} lodLevel
   * @param {object} options
   * @returns {Object3D}
   */
  buildJunction(curve, lodLevel, options) {
    if (options.isLeft === undefined || options.isLeft !== this.isLeft) return null;
    return this.buildSegment(curve, lodLevel, options);
  }
}
