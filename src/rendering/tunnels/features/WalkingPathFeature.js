import { Feature } from "./Feature";
import { createGeometryAlongCurve } from "../tunnel-utils";
import { Mesh } from "three";

export class WalkingPathFeature extends Feature {
  name = "walkingPath";

  constructor({ profile, variants, range = { startU: 0, endU: 1 } }) {
    super({ variants });
    if (!(range.startU >= 0) || !(range.endU <= 1) || !(range.endU > range.startU)) {
      throw new Error("Walking path range must be an increasing interval in [0, 1]");
    }
    this.profile = profile;
    this.range = { ...range };
  }

  buildSegment(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const startU = Math.max(options.startU, this.range.startU);
    const endU = Math.min(options.endU, this.range.endU);

    if (endU - startU < 1e-9) return null;

    const startsAtPathStart = Math.abs(startU - this.range.startU) < 1e-9;
    const endsAtPathEnd = Math.abs(endU - this.range.endU) < 1e-9;

    const geometry = createGeometryAlongCurve(this.profile, variant.resolution, curve, false, startsAtPathStart, endsAtPathEnd, startU, endU);

    const walkingPath = new Mesh(geometry, variant.material);
    return walkingPath;
  }

  buildJunction(curve, lodLevel, options) {
    return this.buildSegment(curve, lodLevel, options);
  }
}
