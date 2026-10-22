import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector2,
} from "three";
import { Brush, Evaluator, HOLLOW_SUBTRACTION } from "three-bvh-csg";
import {
  createGeometryAlongCurve,
  createInstancesAlongCurve,
  getMatrixesAlongCurve,
  isPointInsideMesh,
} from "./render-utils";
import { TunnelLamp } from "./TunnelLamp";

function getVariant(variants, lodLevel) {
  return variants?.[lodLevel] ?? null;
}

function mirrorProfile(profile, scale = 1) {
  const fullProfile = profile.map(
    (point) => new Vector2(point.x * scale, point.y * scale),
  );
  for (let i = profile.length - 1; i >= 0; i--) {
    fullProfile.push(
      new Vector2(-profile[i].x * scale, profile[i].y * scale),
    );
  }
  return fullProfile;
}

/** Builds the structural tunnel shell and its junction cutter volume. */
export class ShellFeature {
  id = "shell";

  constructor({ variants }) {
    this.variants = variants;
    this.cutterMaterial = new MeshBasicMaterial({ side: DoubleSide });
  }

  hasVariant(lodLevel) {
    return Boolean(getVariant(this.variants, lodLevel));
  }

  createShellGeometry(curve, lodLevel, options = {}) {
    const variant = getVariant(this.variants, lodLevel);
    if (!variant) return null;

    const {
      scale = 1,
      sealed = false,
      startU = 0,
      endU = 1,
      distanceOffset = 0,
      sealStart = sealed,
      sealEnd = sealed,
    } = options;

    return createGeometryAlongCurve(
      mirrorProfile(variant.profile, scale),
      variant.resolution,
      curve,
      sealed,
      sealed,
      startU,
      endU,
      distanceOffset,
      sealStart,
      sealEnd,
    );
  }

  buildSegment(context) {
    const variant = getVariant(this.variants, context.lodLevel);
    if (!variant) return null;

    return new Mesh(
      this.createShellGeometry(context.curve, context.lodLevel, {
        startU: context.startU ?? 0,
        endU: context.endU ?? 1,
        distanceOffset: context.startDistance ?? 0,
      }),
      variant.material,
    );
  }

  createCutter(curve, lodLevel) {
    const geometry = this.createShellGeometry(curve, lodLevel, {
      scale: 0.99999,
      sealed: true,
    });
    if (!geometry) throw new Error(`Shell feature has no ${lodLevel} variant`);
    return new Brush(geometry, this.cutterMaterial);
  }

  buildJunction(context) {
    const variant = getVariant(this.variants, context.lodLevel);
    if (!variant) return null;

    const shell = new Brush(
      this.createShellGeometry(context.curve, context.lodLevel),
      variant.material,
    );
    return new Evaluator().evaluate(
      shell,
      context.junction.peerCutter,
      HOLLOW_SUBTRACTION,
    );
  }
}

/** Builds a floor strip with its own cross-section and LOD settings. */
export class FloorFeature {
  id = "floor";

  constructor({ variants, profile, junctionOffset = 0.0005 }) {
    this.variants = variants;
    this.profile = profile;
    this.junctionOffset = junctionOffset;
  }

  buildSegment(context) {
    const variant = getVariant(this.variants, context.lodLevel);
    if (!variant) return null;

    const geometry = createGeometryAlongCurve(
      this.profile,
      variant.resolution,
      context.curve,
      false,
      false,
      context.startU ?? 0,
      context.endU ?? 1,
      context.startDistance ?? 0,
    );
    return new Mesh(geometry, variant.material);
  }

  buildJunction(context) {
    const floor = this.buildSegment(context);
    if (floor && context.junction.branchIndex > 0) {
      floor.position.y += this.junctionOffset;
    }
    return floor;
  }
}

/** Builds the two rails as one feature group. */
export class RailFeature {
  id = "rails";

  constructor({ variants, offset = new Vector2(), distanceBetween = 0.5 }) {
    this.variants = variants;
    this.offset = offset;
    this.distanceBetween = distanceBetween;
  }

  buildSegment(context) {
    const variant = getVariant(this.variants, context.lodLevel);
    if (!variant) return null;

    const group = new Group();
    for (const side of [-1, 1]) {
      const railOffset = this.offset
        .clone()
        .add(new Vector2((this.distanceBetween / 2) * side, 0));
      const profile = variant.profile.map((point) => point.clone());
      for (let i = variant.profile.length - 1; i >= 0; i--) {
        profile.push(
          new Vector2(-variant.profile[i].x, variant.profile[i].y),
        );
      }
      for (const point of profile) point.add(railOffset);

      const geometry = createGeometryAlongCurve(
        profile,
        variant.resolution,
        context.curve,
        true,
        false,
        context.startU ?? 0,
        context.endU ?? 1,
        context.startDistance ?? 0,
      );
      group.add(new Mesh(geometry, variant.material));
    }
    return group;
  }
}

/** Places instanced sleepers at a fixed distance phase along the tunnel path. */
export class SleeperFeature {
  id = "sleepers";

  constructor({ variants, profilePoint = new Vector2() }) {
    this.variants = variants;
    this.profilePoint = profilePoint;
  }

  buildSegment(context) {
    const variant = getVariant(this.variants, context.lodLevel);
    if (!variant) return null;

    return createInstancesAlongCurve(
      this.profilePoint,
      variant.geometry,
      variant.material,
      variant.resolution,
      context.curve,
      context.startU ?? 0,
      context.endU ?? 1,
      0,
    );
  }
}

/** Places lamps along a segment and suppresses lamps inside the other branch. */
export class LightFeature {
  id = "lights";

  constructor({ variants }) {
    this.variants = variants;
  }

  buildSegment(context) {
    return this.#build(context);
  }

  buildJunction(context) {
    return this.#build(context);
  }

  #build(context) {
    const variant = getVariant(this.variants, context.lodLevel);
    if (!variant) return null;

    const matrices = getMatrixesAlongCurve(
      variant.profilePoint,
      variant.resolution,
      context.curve,
      context.startU ?? 0,
      context.endU ?? 1,
      0,
    );
    const lamps = new Group();

    for (const matrix of matrices) {
      const lamp = new TunnelLamp(
        variant.casing,
        variant.light,
        variant.lodLevels,
      );
      matrix.decompose(lamp.position, lamp.quaternion, lamp.scale);
      lamp.updateMatrix();

      if (
        context.junction?.peerCutter &&
        isPointInsideMesh(lamp.position, context.junction.peerCutter)
      ) {
        lamp.visible = false;
      }

      lamps.add(lamp);
    }

    return lamps;
  }
}

/**
 * A tunnel-scope feature. The manager supplies equal-length chunks and this
 * feature intersects them with its visible path range.
 */
export class WalkingPathFeature {
  id = "walkingPath";

  constructor({ profile, variants, range = { startU: 0, endU: 1 } }) {
    if (
      !(range.startU >= 0) ||
      !(range.endU <= 1) ||
      !(range.endU > range.startU)
    ) {
      throw new Error("Walking path range must be an increasing interval in [0, 1]");
    }
    this.profile = profile;
    this.variants = variants;
    this.range = { ...range };
  }

  buildChunk(context) {
    const variant = getVariant(this.variants, context.lodLevel);
    if (!variant) return null;

    const startU = Math.max(context.startU, this.range.startU);
    const endU = Math.min(context.endU, this.range.endU);
    if (endU <= startU) return null;

    const startsAtPathStart = Math.abs(startU - this.range.startU) < 1e-9;
    const endsAtPathEnd = Math.abs(endU - this.range.endU) < 1e-9;
    const startDistance = startU * context.totalLength;
    const geometry = createGeometryAlongCurve(
      this.profile,
      variant.resolution,
      context.curve,
      false,
      false,
      startU,
      endU,
      startDistance,
      startsAtPathStart,
      endsAtPathEnd,
    );

    return new Mesh(geometry, variant.material);
  }
}
