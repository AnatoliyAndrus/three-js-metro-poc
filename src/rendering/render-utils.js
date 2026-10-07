"use strict";
import {
  CubicBezierCurve3,
  Vector3,
  Vector2,
  BufferGeometry,
  BufferAttribute,
  Matrix4,
  InstancedMesh,
} from "three";
import { Tunnel } from "../domain/Tunnel";
import { Port } from "../domain/Port";
/**
 * Creates set of Bezier curve
 * @param {Tunnel} tunnel
 * @param {number} curvature parameter to set distance from point to control point, defined as percent of distance between start and end point of curve, example, 0.1 = 10% of distance
 * @returns {CubicBezierCurve3[]} set of curves that define this tunnel
 */
export function createTunnelCurves(tunnel, curvature = 0.3) {
  const curves = [];

  const fromGlobalPosition = getPortGlobalPosition(tunnel.from);
  const fromDirection = getPortDirectionVector(tunnel.from);

  const toGlobalPosition = getPortGlobalPosition(tunnel.to);
  const toDirection = getPortDirectionVector(tunnel.to);

  //saving previous end direction, and setting its negated version to next start direction to make less computations
  let prevEndDirection = null;
  //for example, if there are no points at all, this shall make one iteration, drawing line between 'from' and 'to' ports
  for (let i = 0; i < tunnel.points.length + 1; i++) {
    //start and end of the line. Might have port position
    let startPoint;
    let endPoint;
    //normalized vectors which define where control points will be
    let startDirection;
    let endDirection;

    if (i === 0) {
      startPoint = fromGlobalPosition;
      startDirection = fromDirection;
    } else {
      startPoint = tunnel.points[i - 1];
      startDirection = prevEndDirection.clone().negate();
    }

    if (i === tunnel.points.length) {
      endPoint = toGlobalPosition;
      endDirection = toDirection.negate();
    } else {
      endPoint = tunnel.points[i];
      let nextPoint =
        i === tunnel.points.length - 1
          ? toGlobalPosition
          : tunnel.points[i + 1];
      endDirection = startPoint.clone().sub(nextPoint).normalize();
      prevEndDirection = endDirection.clone();
    }

    const distanceBetweenStartEnd = endPoint.clone().sub(startPoint).length();
    const controlPoint1 = startDirection
      .clone()
      .multiplyScalar(distanceBetweenStartEnd * curvature)
      .add(startPoint);
    const controlPoint2 = endDirection
      .clone()
      .multiplyScalar(distanceBetweenStartEnd * curvature)
      .add(endPoint);
    curves.push(
      new CubicBezierCurve3(startPoint, controlPoint1, controlPoint2, endPoint),
    );
  }
  return curves;
}

/**
 * @param {Port} port
 * @returns {Vector3} global position of the port, taking into account position and rotation of its node
 */
export function getPortGlobalPosition(port) {
  return port.localPosition
    .clone()
    .applyEuler(port.node.rotation)
    .add(port.node.position);
}

/**
 *
 * @param {Port} port
 * @returns {Vector3} direction vector of port is considered its x axis
 */
export function getPortDirectionVector(port) {
  return new Vector3(1, 0, 0)
    .applyEuler(port.localRotation)
    .applyEuler(port.node.rotation);
}

/**
 * Function that creates geometry along curve, such as tunnel shell, floor or rail.
 * @param {Vector2[]} profile set of points that define profile. May be asymmetric.
 * @param {number} resolution number of profiles per unit of length
 * @param {Curve} curve
 * @param {boolean} fullTube whether first and last points of geometry are connected
 * @returns {BufferGeometry}
 */
export function createGeometryAlongCurve(
  profile,
  resolution,
  curve,
  fullTube = false,
) {
  const numberOfProfiles = Math.ceil(resolution * curve.getLength()) + 1;

  const geometry = new BufferGeometry();
  const positionAttribute = [];
  const index = [];

  // consider points of tunnel shell as grid with i - number of segment and j - number of point in segment
  const pointToIndex = (i, j) => {
    return i * profile.length + j;
  };
  for (let i = 0; i < numberOfProfiles; i++) {
    const currentU = i / (numberOfProfiles - 1);
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
 * @param {number} u
 * @param {Curve} curve
 * @returns {{point: Vector3, tangent: Vector3, side: Vector3, localUp: Vector3}}
 */
export function getCurveFrame(u, curve) {
  const point = curve.getPointAt(u);

  // tangent, localUp and side are basis used to transform local coordinate of point according to the curve
  const tangent = curve.getTangentAt(u);
  const globalUp = new Vector3(0, 1, 0);
  const side = new Vector3().crossVectors(globalUp, tangent).normalize();
  const localUp = new Vector3().crossVectors(tangent, side).normalize();

  return { point: point, tangent: tangent, side: side, localUp: localUp };
}

/**
 *
 * @param {Vector2[]} localPoints
 * @param {number} u
 * @param {Curve} curve
 * @returns {Vector3[]}
 */
export function getProfileGlobalPoints(localPoints, u, curve) {
  const frame = getCurveFrame(u, curve);

  const globalPoints = [];

  for (let localPoint of localPoints) {
    globalPoints.push(
      frame.point
        .clone()
        .addScaledVector(frame.side, localPoint.x)
        .addScaledVector(frame.localUp, localPoint.y),
    );
  }
  return globalPoints;
}

/**
 *
 * @param {Vector2} profilePoint point where instances will be placed
 * @param {BufferGeometry} geometry
 * @param {Material} material
 * @param {number} resolution number of instances per unit of length
 * @param {Curve} curve
 * @returns {InstancedMesh} created instances
 */
export function createInstancesAlongCurve(
  profilePoint,
  geometry,
  material,
  resolution,
  curve,
) {
  const count = Math.ceil(curve.getLength() * resolution);
  const mesh = new InstancedMesh(geometry, material, count);

  const matrix = new Matrix4();
  for (let i = 0; i < count; i++) {
    const currentU = i / count;
    const globalPoint = getProfileGlobalPoints(
      [profilePoint],
      currentU,
      curve,
    )[0];
    const frame = getCurveFrame(currentU, curve);

    matrix.makeBasis(frame.side, frame.localUp, frame.tangent);
    matrix.setPosition(globalPoint);
    mesh.setMatrixAt(i, matrix);
  }

  return mesh;
}
