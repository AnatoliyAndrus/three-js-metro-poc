"use strict";
import { Vector3, Euler } from "three";
import * as UUID from "uuid";

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

  constructor(
    position = new Vector3(),
    rotation = new Euler(0, 0, 0),
    id = null,
  ) {
    this.id = id ?? UUID.v4();
    this.position = position;
    this.rotation = rotation;
  }

  toJSON() {
    return {
      id: this.id,
      position: this.position.toArray(),
      rotation: this.rotation.toArray(),
    };
  }

  static fromJSON(data) {
    return new MetroNode(
      new Vector3().fromArray(data.position),
      new Euler().fromArray(data.rotation),
      data.id,
    );
  }
}
