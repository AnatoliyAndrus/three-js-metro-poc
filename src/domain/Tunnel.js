"use strict";
import { Vector3 } from "three";
import { Port } from "./Port";
import * as UUID from "uuid";
/**
 * class of tunnel that connects two ports
 */
export class Tunnel {
  id;
  /**@type {Port} */
  from;
  /**@type {Port} */
  to;
  /**@type {Vector3[]} */
  points;

  /**
   * @param {Port} from
   * @param {Port} to
   * @param {Vector3[]} points
   * @param {String|null} id
   */
  constructor(from, to, points = [], id) {
    if (from.type != "from")
      throw new Error("'From' port must have type 'from'");
    if (to.type != "to") throw new Error("'To' port must have type 'to'");
    this.id = id ?? UUID.v4();
    this.from = from;
    this.to = to;
    this.points = points;
  }

  toJSON() {
    return {
      id: this.id,
      fromId: this.from.id,
      toId: this.to.id,
      points: this.points.map((point) => point.toArray()),
    };
  }
}
