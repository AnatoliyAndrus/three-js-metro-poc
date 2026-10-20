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
    // port depends on its node, tunnel depends on port 'from' and 'to'
    const nodes = data.nodes.map((node) => MetroNode.fromJSON(node));

    // ports depend on nodes and other ports, so their deserialization happens here
    const ports = [];
    for (const portData of data.ports) {
      const portNode = nodes.find((node) => node.id == portData.nodeId);

      ports.push(
        new Port(
          new Vector3().fromArray(portData.localPosition),
          new Euler().fromArray(portData.localRotation),
          portNode,
          portData.type,
          [],
          portData.id,
        ),
      );
    }
    for (const port of ports) {
      const portData = data.ports.find((portData) => portData.id === port.id);
      if (portData.connectedPorts) {
        portData.connectedPorts
          .map((connectedPortId) => ports.find((p) => p.id === connectedPortId))
          .forEach((p) => port.connectWith(p));
      }
    }

    const tunnels = data.tunnels.map((tunnel) => {
      const from = ports.find((port) => port.id == tunnel.fromId);
      const to = ports.find((port) => port.id == tunnel.toId);
      const points = tunnel.points.map((point) =>
        new Vector3().fromArray(point),
      );
      return new Tunnel(from, to, points, tunnel.id);
    });

    return new Metro(nodes, ports, tunnels);
  }

  /**
   * adds junction with given ports
   * all junctions and their ports are located in horizontal plane, therefore they have only y rotation. local position of port is set in x and z coordinates.
   * junction is node where there are exactly 2 'to' ports and 1 'from' port or vice versa
   * @param {Vector3} nodePosition
   * @param {number} nodeRotationY
   * @param {{x: number, z: number, yRotation:number, type:string}[]} portsInfo
   * @returns {MetroNode}
   */
  addJunction(nodePosition, nodeRotationY, portsInfo) {
    if (portsInfo?.length !== 3) {
      throw new Error("There are exactly 3 ports in the junction");
    }

    const toInfo = portsInfo.filter((port) => port.type === "to");
    const fromInfo = portsInfo.filter((port) => port.type === "from");

    if (
      !(
        (toInfo.length === 1 && fromInfo.length === 2) ||
        (toInfo.length === 2 && fromInfo.length === 1)
      )
    ) {
      throw new Error(
        "There must be exactly 1 port of one type and 2 of another",
      );
    }

    const node = new MetroNode(
      nodePosition,
      new Euler(0, nodeRotationY, 0),
      "junction",
    );

    this.nodes.push(node);

    const ports = portsInfo.map(
      (info) =>
        new Port(
          new Vector3(info.x, 0, info.z),
          new Euler(0, info.yRotation, 0),
          node,
          info.type,
        ),
    );

    this.ports.push(...ports);

    const singlePort = ports.find(
      (port) =>
        ports.filter((candidate) => candidate.type === port.type).length === 1,
    );
    const otherPorts = ports.filter((port) => port !== singlePort);

    otherPorts.forEach((port) => singlePort.connectWith(port));

    return node;
  }
}
