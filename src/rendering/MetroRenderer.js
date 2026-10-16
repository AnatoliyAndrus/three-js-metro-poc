import * as THREE from "three";
import { Metro } from "../domain/Metro";
import { createTunnelCurves } from "./render-utils";
import { TunnelSegmentFactory } from "./TunnelSegmentFactory";
import { JunctionFactory } from "./JunctionFactory";

export class MetroRenderer {
  #scene;
  #tunnels = [];
  #tunnelSegmentFactory;
  #junctionFactory;

  /**
   *
   * @param {THREE.Scene} scene
   * @param {TunnelSegmentFactory} tunnelSegmentFactory
   */
  constructor(scene, tunnelSegmentFactory) {
    this.#scene = scene;
    this.#tunnelSegmentFactory = tunnelSegmentFactory;
    this.#junctionFactory = new JunctionFactory(tunnelSegmentFactory);
  }

  /**
   *
   * @param {Metro} metro
   */
  render(metro) {
    for (const tunnel of metro.tunnels) {
      const curves = createTunnelCurves(tunnel, 0.3);
      const tunnelSegments = [];
      for (const curve of curves) {
        const tunnelSegment = this.#tunnelSegmentFactory.create(curve);

        tunnelSegments.push(tunnelSegment);
        this.#scene.add(tunnelSegment);
      }
      this.#tunnels.push(tunnelSegments);
    }

    for (const metroNode of metro.nodes) {
      if (metroNode.type == "junction") {
        this.#scene.add(this.#junctionFactory.create(metroNode));
      }
    }
  }
}
