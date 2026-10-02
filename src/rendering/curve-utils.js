"use strict";
import { CubicBezierCurve3, Vector3 } from "three";
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
      endDirection = toDirection;
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
function getPortGlobalPosition(port) {
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
function getPortDirectionVector(port) {
  return new Vector3(1, 0, 0)
    .applyEuler(port.localRotation)
    .applyEuler(port.node.rotation);
}
