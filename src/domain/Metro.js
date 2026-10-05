"use strict";
import { Vector3, Euler } from "three";
import { MetroNode } from "./MetroNode";
import { Port } from "./Port";
import { Tunnel } from "./Tunnel";
/**
 * Object that contains all information about metro system, such as ports, metro nodes, tunnels
 */
export class Metro {
  /**@type {MetroNode[]} */
  nodes;
  /**@type {Port[]} */
  ports;
  /**@type {Tunnel[]} */
  tunnels;

  constructor(nodes = [], ports = [], tunnels = []) {
    this.nodes = nodes;
    this.ports = ports;
    this.tunnels = tunnels;
  }

  toJSON() {
    return {
      nodes: this.nodes.map((node) => node.toJSON()),
      ports: this.ports.map((port) => port.toJSON()),
      tunnels: this.tunnels.map((tunnel) => tunnel.toJSON()),
    };
  }
  static fromJSON(data) {
    // port depends on its node, tunnel depends on port from and to
    const nodes = data.nodes.map((node) => MetroNode.fromJSON(node));
    const ports = data.ports.map((port) => Port.fromJSON(port, nodes));
    const tunnels = data.tunnels.map((tunnel) =>
      Tunnel.fromJSON(tunnel, ports),
    );

    return new Metro(nodes, ports, tunnels);
  }

  /**
   * adds junction with given ports
   * all junctions and their ports are located in horizontal plane, therefore they have only y rotation. local position of port is set in x and z coordinates.
   * @param {Vector3} nodePosition
   * @param {number} nodeRotationY
   * @param {object[]} portsInfo array of objects with fields x, z, yRotation, type ('in' or 'out')
   */
  addJunction(nodePosition, nodeRotationY, portsInfo) {
    if (portsInfo?.length !== 3)
      throw new Error("There are exactly 3 ports in the junction");

    const inCount = portsInfo.filter((port) => port.type === "in").length;
    const outCount = portsInfo.filter((port) => port.type === "out").length;

    if (
      !((inCount === 1 && outCount === 2) || (inCount === 2 && outCount === 1))
    ) {
      throw new Error(
        "there must be exactly 1 port of one type and 2 of another",
      );
    }
    const node = new MetroNode(
      nodePosition,
      new Euler(0, nodeRotationY, 0),
      "junction",
    );

    this.nodes.push(node);

    portsInfo.forEach((port) => {
      this.ports.push(
        new Port(
          new Vector3(port.x, 0, port.z),
          new Euler(0, port.yRotation, 0),
          node,
          port.type,
        ),
      );
    });
  }
}
