import { Euler } from "three";
import { BufferGeometry, Vector3 } from "three";
import { CubicBezierCurve3, Vector2 } from "three";

export class TunnelSegmentBuilder {
  // represents array of points that represent half of the tunnel profile, where first point forms tunnel floor. In this coordinate plane, (0, 0) point is intersection with curve
  /**@type {Vector2[]} */
  shellProfile;
  // represents amount of segments of shell along the curve per unit of length
  /**@type {number} */
  shellResolution;

  /**
   *
   * @param {CubicBezierCurve3} curve
   */
  buildShell(curve) {
    const fullShell = [...this.shellProfile];
    for (let i = this.shellProfile.length - 1; i >= 0; i--) {
      fullShell.push(
        new Vector2(-this.shellProfile[i].x, this.shellProfile[i].y),
      );
    }

    const amountOfSegments =
      Math.ceil(this.shellResolution * curve.getLength()) + 1;

    const geometry = new BufferGeometry();
    const positionAttribute = [];
    const index = [];
    const curveLength = curve.getLength();

    for (let i = 0; i < amountOfSegments; i++) {
      const currentLength = i / (amountOfSegments - 1);
      // TO-DO getProfilePointsAlongCurve
    }
  }

  buildFloor(curve) {}

  buildLights(curve) {}

  buildRails(curve) {}
}

/**
 *
 * @param {Vector2[]} localPoints
 * @param {number} u
 * @param {CubicBezierCurve3} curve
 * @returns {Vector3}
 */
function getProfilePointsAlongCurve(localPoints, u, curve) {
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
