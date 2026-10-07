import {
  BufferAttribute,
  BufferGeometry,
  Curve,
  Vector2,
  Vector3,
} from "three";

export class TunnelSegmentFactory {
  // represents array of points that represent half of the tunnel profile, where first point forms tunnel floor. In this coordinate plane, (0, 0) point is intersection with curve
  /**@type {Vector2[]} */
  shellProfile;
  // represents amount of segments of shell along the curve per unit of length
  /**@type {number} */
  shellResolution;

  /**
   * Method that creates geometry of outer shell of tunnel based on shellProfile and shellResolution
   * @param {Curve} curve
   */
  createShellGeometry(curve) {
    const fullShellProfile = [...this.shellProfile];
    for (let i = this.shellProfile.length - 1; i >= 0; i--) {
      fullShellProfile.push(
        new Vector2(-this.shellProfile[i].x, this.shellProfile[i].y),
      );
    }

    return createGeometryAlongCurve(
      fullShellProfile,
      this.shellResolution,
      curve,
      false,
    );
  }

  /**
   * Create floor geometry of tunnel, based on first point of profile.
   * Uses same resolution as shell
   * @param {*} curve
   */
  createFloorGeometry(curve) {
    const profile = [
      new Vector2(-this.shellProfile[0].x, this.shellProfile[0].y),
      this.shellProfile[0],
    ];
    return createGeometryAlongCurve(
      profile,
      this.shellResolution,
      curve,
      false,
    );
  }

  createLights(curve) {}

  createRails(curve) {}
}

/**
 * Function that creates geometries along curve, such as tunnel shell, floor or rail.
 * @param {Vector2[]} profile set of points that define profile. May be asymmetric.
 * @param {number} resolution amount of profiles per unit of length
 * @param {Curve} curve
 * @param {boolean} fullTube whether first and last points of geometry are connected
 */
function createGeometryAlongCurve(
  profile,
  resolution,
  curve,
  fullTube = false,
) {
  const amountOfProfiles = Math.ceil(resolution * curve.getLength()) + 1;

  const geometry = new BufferGeometry();
  const positionAttribute = [];
  const index = [];

  // consider points of tunnel shell as grid with i - number of segment and j - number of point in segment
  const pointToIndex = (i, j) => {
    return i * profile.length + j;
  };
  for (let i = 0; i < amountOfProfiles; i++) {
    const currentU = i / (amountOfProfiles - 1);
    const profileGlobalPoints = getProfileGlobalPoints(
      profile,
      currentU,
      curve,
    );
    for (let j = 0; j < profileGlobalPoints.length; j++) {
      positionAttribute.push(
        profileGlobalPoints[j].x,
        profileGlobalPoints[j].y,
        profileGlobalPoints[j].z,
      );
      if (i > 0 && (fullTube || j > 0)) {
        const prevJ = j > 0 ? j - 1 : profile.length - 1;
        //pushing two polygons into index
        index.push(
          pointToIndex(i, j),
          pointToIndex(i - 1, prevJ),
          pointToIndex(i - 1, j),
        );
        index.push(
          pointToIndex(i, j),
          pointToIndex(i, prevJ),
          pointToIndex(i - 1, prevJ),
        );
      }
    }
  }
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positionAttribute), 3),
  );
  geometry.setIndex(index);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 *
 * @param {Vector2[]} localPoints
 * @param {number} u
 * @param {Curve} curve
 * @returns {Vector3}
 */
function getProfileGlobalPoints(localPoints, u, curve) {
  const pointOnCurve = curve.getPointAt(u);

  // tangent, localUp and side are basis used to translate local coordinate of point according to the curve
  const tangent = curve.getTangentAt(u);
  const globalUp = new Vector3(0, 1, 0);
  const side = new Vector3().crossVectors(globalUp, tangent).normalize();
  const localUp = new Vector3().crossVectors(tangent, side).normalize();

  const globalPoints = [];

  for (let point of localPoints) {
    globalPoints.push(
      pointOnCurve
        .clone()
        .addScaledVector(side, point.x)
        .addScaledVector(localUp, point.y),
    );
  }
  return globalPoints;
}
