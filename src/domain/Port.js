"use strict";
import { Euler, Vector3 } from "three";
import { MetroNode } from "./MetroNode";
import * as UUID from "uuid";
/**
 * Port of node, to which the tunnels would be connected
 * Stores relation with its node
 *
 * Port's global x axis is considered direction of port output
 */
export class Port {
  id;
  /** @type {Vector3} **/
  localPosition;
  /** @type {Euler} **/
  localRotation;
  /** @type {MetroNode} */
  node;
  /** @type {string} type of port, in or out in relation to its node*/
  type;

  /**
   * @param {Vector3} position
   * @param {Euler} rotation
   * @param {String|null} id
   * @param {MetroNode|null} node
   * @param {String} type
   */
  constructor(
    localPosition = new Vector3(),
    localRotation = new Euler(0, 0, 0),
    node = null,
    type = "in",
    id = null,
  ) {
    this.id = id ?? UUID.v4();
    this.localPosition = localPosition;
    this.localRotation = localRotation;
    this.node = node;
    this.type = type;
  }

  /**
   * @returns {Vector3} global position of the port, taking into account position and rotation of its node
   */
  getGlobalPosition() {
    return this.localPosition
      .clone()
      .applyEuler(this.node.rotation)
      .add(this.node.position);
  }

  /**
   *
   * @returns {Vector3} direction vector of port is considered its 'x' axis
   */
  getGlobalDirection() {
    return new Vector3(1, 0, 0)
      .applyEuler(this.localRotation)
      .applyEuler(this.node.rotation);
  }

  toJSON() {
    return {
      id: this.id,
      localPosition: this.localPosition.toArray(),
      localRotation: this.localRotation.toArray(),
      nodeId: this.node.id,
      type: this.type,
    };
  }

  /**
   * Because port object relies on its node, to deserialize it nodes are also needed
   * @param {*} data data of object
   * @param {MetroNode[]} nodes already deserialized array of nodes
   */
  static fromJSON(data, nodes) {
    const node = nodes.find((node) => node.id == data.nodeId);
    return new Port(
      new Vector3().fromArray(data.localPosition),
      new Euler().fromArray(data.localRotation),
      node,
      data.type,
      data.id,
    );
  }
}
