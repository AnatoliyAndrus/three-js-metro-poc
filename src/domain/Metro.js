"use strict";
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
}
