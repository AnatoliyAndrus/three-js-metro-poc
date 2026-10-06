import {
  BufferAttribute,
  BufferGeometry,
  Curve,
  Vector2,
  Vector3,
} from "three";

export class TunnelSegmentBuilder {
  // represents array of points that represent half of the tunnel profile, where first point forms tunnel floor. In this coordinate plane, (0, 0) point is intersection with curve
  /**@type {Vector2[]} */
  shellProfile;
  // represents amount of segments of shell along the curve per unit of length
  /**@type {number} */
  shellResolution;

  /**
   * Method that builds geometry of outer shell of tunnel based on shellProfile and shellResolution
   * @param {Curve} curve
   */
  buildShellGeometry(curve) {
    const fullShellProfile = [...this.shellProfile];
    for (let i = this.shellProfile.length - 1; i >= 0; i--) {
      fullShellProfile.push(
        new Vector2(-this.shellProfile[i].x, this.shellProfile[i].y),
      );
    }

    const amountOfProfiles =
      Math.ceil(this.shellResolution * curve.getLength()) + 1;

    const geometry = new BufferGeometry();
    const positionAttribute = [];
    const index = [];

    // consider points of tunnel shell as grid with i - number of segment and j - number of point in segment
    const pointToIndex = (i, j) => {
      return i * fullShellProfile.length + j;
    };
    for (let i = 0; i < amountOfProfiles; i++) {
      const currentU = i / (amountOfProfiles - 1);
      const profileGlobalPoints = getProfileGlobalPoints(
        fullShellProfile,
        currentU,
        curve,
      );
      for (let j = 0; j < profileGlobalPoints.length; j++) {
        positionAttribute.push(
          profileGlobalPoints[j].x,
          profileGlobalPoints[j].y,
          profileGlobalPoints[j].z,
        );
        if (i > 0 && j > 0) {
          //pushing two polygons into index
          index.push(
            pointToIndex(i, j),
            pointToIndex(i - 1, j),
            pointToIndex(i - 1, j - 1),
          );
          index.push(
            pointToIndex(i, j),
            pointToIndex(i - 1, j - 1),
            pointToIndex(i, j - 1),
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

  buildFloor(curve) {}

  buildLights(curve) {}

  buildRails(curve) {}
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
