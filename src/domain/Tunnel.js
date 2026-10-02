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

  constructor(from, to, points = [], id = null) {
    this.id = id ?? UUID.v4();
    this.from = from;
    this.to = to;
    this.points = points;
    this.id = id;
  }

  toJSON() {
    return {
      id: this.id,
      fromId: this.from.id,
      toId: this.to.id,
      points: this.points.map((point) => point.toArray()),
    };
  }

  /**
   * @param {*} data JSON representation of tunnel object
   * @param {Port[]} ports array of already deserialized ports from which tunnel gets "from" and "to" ports
   * @returns {Tunnel}
   */
  static fromJSON(data, ports) {
    const from = ports.find((port) => port.id == data.fromId);
    const to = ports.find((port) => port.id == data.toId);
    const points = data.points.map((point) => new Vector3().fromArray(point));
    return new Tunnel(from, to, points, data.id);
  }
}
