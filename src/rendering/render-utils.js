"use strict";
import {
  CubicBezierCurve3,
  Vector3,
  Vector2,
  BufferGeometry,
  BufferAttribute,
  Matrix4,
  InstancedMesh,
  ShapeUtils,
  Curve,
} from "three";
import { Tunnel } from "../domain/Tunnel";
/**
 * Creates array of curves and their positions
 * @param {Tunnel} tunnel
 * @param {number} curvature parameter to set distance from point to control point, defined as percent of distance between start and end point of curve, example, 0.1 = 10% of distance
 * @returns {CubicBezierCurve3[]}
 */
export function createTunnelCurves(tunnel, curvature = 0.3) {
  const curves = [];

  const fromGlobalPosition = tunnel.from.getGlobalPosition();
  const fromDirection = tunnel.from.getGlobalDirection();

  const toGlobalPosition = tunnel.to.getGlobalPosition();
  const toDirection = tunnel.to.getGlobalDirection();

  //saving previous end direction, and setting its negated version to next start direction to make less computations
  let prevEndDirection = null;
  //for example, if there are no points at all, this shall make one iteration, drawing line between 'from' and 'to' ports
  for (let i = 0; i < tunnel.points.length + 1; i++) {
    //start and end of the line. Might have port position
    let startPoint = new Vector3();
    let endPoint = new Vector3();
    //normalized vectors which define where control points will be
    let startDirection = new Vector3();
    let endDirection = new Vector3();

    if (i === 0) {
      startPoint.copy(fromGlobalPosition);
      startDirection.copy(fromDirection);
    } else {
      startPoint.copy(tunnel.points[i - 1]);
      startDirection.copy(prevEndDirection).negate();
    }

    if (i === tunnel.points.length) {
      endPoint.copy(toGlobalPosition);
      endDirection.copy(toDirection).negate();
    } else {
      endPoint.copy(tunnel.points[i]);
      let nextPoint =
        i === tunnel.points.length - 1
          ? toGlobalPosition.clone()
          : tunnel.points[i + 1].clone();
      endDirection = startPoint.clone().sub(nextPoint).normalize();
      prevEndDirection = endDirection.clone();
    }
    curves.push(
      createCurve(
        startPoint,
        startDirection,
        endDirection,
        endPoint,
        curvature,
      ),
    );
  }
  return curves;
}

/**
 *
 * @param {Vector3} startPoint
 * @param {Vector3} startDirection
 * @param {Vector3} endDirection
 * @param {Vector3} endPoint
 * @param {number} curvature
 * @returns {CubicBezierCurve3} curve
 */
export function createCurve(
  startPoint,
  startDirection,
  endDirection,
  endPoint,
  curvature = 0.3,
) {
  const distanceBetweenStartEnd = endPoint.clone().sub(startPoint).length();
  const controlPoint1 = startDirection
    .clone()
    .multiplyScalar(distanceBetweenStartEnd * curvature)
    .add(startPoint);
  const controlPoint2 = endDirection
    .clone()
    .multiplyScalar(distanceBetweenStartEnd * curvature)
    .add(endPoint);
  return new CubicBezierCurve3(
    startPoint,
    controlPoint1,
    controlPoint2,
    endPoint,
  );
}

/**
 * Function that creates geometry along curve, such as tunnel shell, floor or rail.
 * Supports creation of geometries that cover only part of curve length, using startU and endU
 * @param {Vector2[]} profile set of points that define profile. May be asymmetric.
 * @param {number} resolution number of profiles per unit of length
 * @param {Curve} curve
 * @param {boolean} fullTube whether first and last points of profiles are connected
 * @param {boolean} sealedTube whether whether first and last profiles are sealed
 * @param {number} startU where from on curve geometry starts
 * @param {number} endU where geometry stretches to
 * @returns {BufferGeometry}
 */
export function createGeometryAlongCurve(
  profile,
  resolution,
  curve,
  fullTube = false,
  sealedTube = false,
  startU = 0,
  endU = 1.0,
) {
  const curvePartLength = curve.getLength() * (endU - startU);
  const numberOfProfiles = Math.ceil(resolution * curvePartLength) + 1;

  const geometry = new BufferGeometry();
  const positionAttribute = [];
  const index = [];
  const uvAttribute = [];

  // consider points of tunnel shell as grid with i - number of segment and j - number of point in segment
  const pointToIndex = (i, j) => {
    return i * profile.length + j;
  };
  for (let i = 0; i < numberOfProfiles; i++) {
    // for i == 0 currentU == startU, for i == (numberOfProfiles - 1) currentU == endU
    const currentU = (i / (numberOfProfiles - 1)) * (endU - startU) + startU;
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

      uvAttribute.push(
        i / (numberOfProfiles - 1),
        j / (profileGlobalPoints.length - 1),
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

  if (sealedTube) {
    const sealIndex = ShapeUtils.triangulateShape(profile, []);

    const lastProfileOffset = profile.length * (numberOfProfiles - 1);
    for (let polygon of sealIndex) {
      index.push(polygon[0], polygon[2], polygon[1]);

      index.push(
        polygon[0] + lastProfileOffset,
        polygon[1] + lastProfileOffset,
        polygon[2] + lastProfileOffset,
      );
    }
  }

  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positionAttribute), 3),
  );
  geometry.setAttribute(
    "uv",
    new BufferAttribute(new Float32Array(uvAttribute), 2),
  );
  geometry.setIndex(index);

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Function that creates basis vectors for profile transformations
 * @param {number} u
 * @param {Curve} curve
 * @returns {{point: Vector3, tangent: Vector3, side: Vector3, localUp: Vector3}} side - vector perpendicular to tangent, local and global 'up' vectors, is considered 'x' axis; localUp - considered 'y' axis; tangent - considered 'z' axis; point - point on curve, (0, 0, 0) in this space
 */
function getCurveFrame(u, curve) {
  const point = curve.getPointAt(u);

  // tangent, localUp and side are basis used to transform local coordinate of point according to the curve
  const tangent = curve.getTangentAt(u);
  const globalUp = new Vector3(0, 1, 0);
  const side = new Vector3().crossVectors(globalUp, tangent).normalize();
  const localUp = new Vector3().crossVectors(tangent, side).normalize();

  return { point: point, tangent: tangent, side: side, localUp: localUp };
}

/**
 * Transforms local profile points of 2d space into global 3d space according to position on the curve
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
 * Creates InstancedMesh copies of geometry along the curve, rotated accordingly
 * Used, for example, for making sleepers in tunnel
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
  const matrices = getMatrixesAlongCurve(profilePoint, resolution, curve);
  const mesh = new InstancedMesh(geometry, material, matrices.length);

  for (let i = 0; i < matrices.length; i++) {
    mesh.setMatrixAt(i, matrices[i]);
  }

  return mesh;
}

/**
 * Makes transformation matrices for objects along the curve
 * @param {Vector2} profilePoint
 * @param {number} resolution
 * @param {Curve} curve
 * @returns {Matrix4[]} matrices
 */
export function getMatrixesAlongCurve(profilePoint, resolution, curve) {
  const count = Math.ceil(curve.getLength() * resolution);
  const matrices = [];

  for (let i = 0; i < count; i++) {
    const currentU = i / count;
    const globalPoint = getProfileGlobalPoints(
      [profilePoint],
      currentU,
      curve,
    )[0];
    const frame = getCurveFrame(currentU, curve);
    const matrix = new Matrix4();
    matrix.makeBasis(frame.side, frame.localUp, frame.tangent);
    matrix.setPosition(globalPoint);
    matrices.push(matrix);
  }

  return matrices;
}
