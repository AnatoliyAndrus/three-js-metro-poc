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
  /**@type {Port} */
  connectedPort;

  /**
   * @param {Vector3} position
   * @param {Euler} rotation
   * @param {MetroNode|null} node
   * @param {String} type
   * @param {Port} connectedPort
   * @param {String|null} id
   */
  constructor(
    localPosition = new Vector3(),
    localRotation = new Euler(0, 0, 0),
    node = null,
    type = "in",
    connectedPort = null,
    id,
  ) {
    console.log(connectedPort);
    this.id = id ?? UUID.v4();
    this.localPosition = localPosition;
    this.localRotation = localRotation;
    if (node) this.setNode(node);
    this.type = type;
    this.connectWith(connectedPort);
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
    console.log(port);
    if (this.connectedPort === port) return this;
    if (port && !(port instanceof Port)) throw Error("Must be port");

    if (this === port) throw new Error("Cannot connect port with itself");
    if (port && this.node !== port.node)
      throw new Error("Port can't be connected to port from another node");

    if (this.connectedPort) this.connectedPort.connectedPort = null;
    this.connectedPort = port;

    if (port) port.connectedPort = this;
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
      connectedPortId: this.connectedPort?.id,
      type: this.type,
    };
  }
}
