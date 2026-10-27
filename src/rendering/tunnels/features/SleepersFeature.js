import { createInstancesAlongCurve } from "../tunnel-utils";
import { Feature } from "./Feature";
import { Vector2 } from "three";

export class SleepersFeature extends Feature {
  name = "sleepers";

  constructor({ variants, profilePoint = new Vector2() }) {
    super({ variants });
    this.profilePoint = profilePoint;
  }

  buildSegment(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    return createInstancesAlongCurve(this.profilePoint, variant.geometry, variant.material, variant.resolution, curve, options.startU ?? 0, options.endU ?? 1);
  }

  buildJunction(curve, lodLevel, options) {
    return this.buildSegment(curve, lodLevel, options);
  }
}
