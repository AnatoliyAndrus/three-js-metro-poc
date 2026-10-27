import { Curve, Object3D, Group, Mesh } from "three";
import { createGeometryAlongCurve, createInstancesAlongCurve } from "../tunnel-utils";
import { Feature } from "./Feature";

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

    if (variant.fastener) {
      group.add(createInstancesAlongCurve(this.offset, variant.fastener.geometry, variant.fastener.material, variant.fastener.resolution, curve, options.startU ?? 0, options.endU ?? 1));
    }

    const pipe = new Mesh(createGeometryAlongCurve(this.profile, variant.resolution, curve, true, true, true, options.startU ?? 0, options.endU ?? 1), variant.material);
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
