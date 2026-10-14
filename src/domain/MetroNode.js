"use strict";
import { Vector3, Euler } from "three";
import * as UUID from "uuid";
import { Port } from "./Port";

/**
 * Object that stores info about metro node, such as metro station or junction
 * Stores position of node (its center) as Vector3 and its rotation
 */
export class MetroNode {
  id;
  /** @type {Vector3} */
  position;
  /** @type {Euler} **/
  rotation;
  // type of node: station or junction
  /** @type {String} */
  type;
  /**@type {Port[]} */
  ports = [];

  constructor(
    position = new Vector3(),
    rotation = new Euler(0, 0, 0),
    type = "station",
    id,
  ) {
    this.id = id ?? UUID.v4();
    this.position = position;
    this.rotation = rotation;
    this.type = type;
  }

  /**
   *
   * @param {Port} port
   * @returns {this}
   */
  addPort(port) {
    port.setNode(this);
    return this;
  }

  /**
   *
   * @param {Port} port
   * @returns {this}
   */
  removePort(port) {
    if (port.node !== this) return this;

    port.setNode(null);
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      position: this.position.toArray(),
      rotation: this.rotation.toArray(),
      type: this.type,
    };
  }

  static fromJSON(data) {
    return new MetroNode(
      new Vector3().fromArray(data.position),
      new Euler().fromArray(data.rotation),
      data.type,
      data.id,
    );
  }
}
