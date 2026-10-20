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
  /** @type {string} type of port, 'to' or 'from' in relation to its node*/
  type;
  /**@type {Port[]} */
  connectedPorts = [];

  /**
   * @param {Vector3} position
   * @param {Euler} rotation
   * @param {MetroNode|null} node
   * @param {String} type
   * @param {Port[]} connectedPorts
   * @param {String|null} id
   */
  constructor(
    localPosition = new Vector3(),
    localRotation = new Euler(0, 0, 0),
    node = null,
    type = "to",
    connectedPorts = [],
    id,
  ) {
    this.id = id ?? UUID.v4();
    this.localPosition = localPosition;
    this.localRotation = localRotation;
    if (node) this.setNode(node);
    this.type = type;

    for (let port of connectedPorts) {
      this.connectWith(port);
    }
  }

  /**
   *
   * @param {MetroNode} node
   * @returns {this}
   */
  setNode(node) {
    if (this.node === node) return this;

    this.node?.removePort(this);

    this.node = node ?? null;

    if (node && !node.ports.includes(this)) {
      node.ports.push(this);
    }

    return this;
  }

  /**
   *
   * @returns {this}
   */
  removeNode() {
    return this.setNode(null);
  }

  /**
   * @param {Port}
   * @returns {this}
   */
  connectWith(port) {
    if (this.connectedPorts.indexOf(port) >= 0) return this;
    if (port && !(port instanceof Port)) throw Error("Must be port");

    if (this === port) throw new Error("Cannot connect port with itself");
    if (port && this.node !== port.node)
      throw new Error("Port can't be connected to port from another node");

    this.connectedPorts.push(port);
    port.connectedPorts.push(this);
    return this;
  }

  /**
   * @param {Port}
   * @returns {this}
   */
  disconnectWith(port) {
    const index1 = this.connectedPorts.indexOf(port);
    if (index1 < 0) return this;

    this.connectedPorts.splice(index1, 1);
    const index2 = port.connectedPorts.indexOf(this);
    if (index2 >= 0) port.connectedPorts.splice(index2, 1);

    return this;
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
      nodeId: this.node?.id,
      connectedPorts: this.connectedPorts.map((port) => port.id),
      type: this.type,
    };
  }
}
