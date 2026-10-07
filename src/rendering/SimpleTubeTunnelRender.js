import * as THREE from "three";
import { Metro } from "../domain/Metro";
import { createTunnelCurves } from "./render-utils";
import { TunnelSegmentFactory } from "./TunnelSegmentFactory";

export class SimpleTubeTunnelRenderer {
  #scene;
  #tunnels = [];
  #tunnelSegmentFactory;

  /**
   *
   * @param {THREE.Scene} scene
   * @param {TunnelSegmentFactory} tunnelSegmentFactory
   */
  constructor(scene, tunnelSegmentFactory) {
    this.#scene = scene;
    this.#tunnelSegmentFactory = tunnelSegmentFactory;
  }

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
  }
}
