import { Feature } from "./Feature";
import { Group, Vector2, Mesh } from "three";
import { createGeometryAlongCurve } from "../tunnel-utils";

/** Builds the two rails as one feature group. */
export class RailsFeature extends Feature {
  name = "rails";

  constructor({ variants, offset = new Vector2(), distanceBetween = 0.5 }) {
    super({ variants });
    this.offset = offset;
    this.distanceBetween = distanceBetween;
  }

  buildSegment(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const group = new Group();
    for (const side of [-1, 1]) {
      const railOffset = this.offset.clone().add(new Vector2((this.distanceBetween / 2) * side, 0));
      const profile = variant.profile.map((point) => point.clone());
      for (let i = variant.profile.length - 1; i >= 0; i--) {
        profile.push(new Vector2(-variant.profile[i].x, variant.profile[i].y));
      }
      for (const point of profile) point.add(railOffset);

      const geometry = createGeometryAlongCurve(profile, variant.resolution, curve, true, false, false, options.startU ?? 0, options.endU ?? 1);
      group.add(new Mesh(geometry, variant.material));
    }
    return group;
  }

  buildJunction(curve, lodLevel, options) {
    return this.buildSegment(curve, lodLevel, options);
  }
}
