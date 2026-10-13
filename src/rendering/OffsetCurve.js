import { Curve, Vector3 } from "three";

/**
 * Wrapper for curve, offsets curve points by given vector
 */
export class OffsetCurve extends Curve {
  /**@type {Curve} */
  curve;
  /**@type {Vector3} */
  offset;

  /**
   *
   * @param {Curve} curve
   * @param {Vector3} offset
   */
  constructor(curve, offset) {
    super();
    this.curve = curve;
    this.offset = offset ?? new Vector3(0, 0, 0);
    this.arcLengthDivisions = curve.arcLengthDivisions;
  }

  getPoint(t, optionalTarget) {
    return this.curve.getPoint(t, optionalTarget).add(this.offset);
  }

  getPointAt(u, optionalTarget) {
    return this.curve.getPointAt(u, optionalTarget).add(this.offset);
  }

  getLength() {
    return this.curve.getLength();
  }

  getLengths(divisions) {
    return this.curve.getLengths(divisions);
  }

  getUtoTmapping(u, distance) {
    return this.curve.getUtoTmapping(u, distance);
  }

  getTangent(t, optionalTarget) {
    return this.curve.getTangent(t, optionalTarget);
  }

  getTangentAt(u, optionalTarget) {
    return this.curve.getTangentAt(u, optionalTarget);
  }

  clone() {
    return new OffsetCurve(this.curve.clone(), this.offset);
  }

  copy(source) {
    super.copy(source);

    this.offset = source.offset.clone();
    this.curve = source.curve.clone();
    return this;
  }
}
