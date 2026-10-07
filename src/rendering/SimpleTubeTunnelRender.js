import * as THREE from "three";
import { Metro } from "../domain/Metro";
import { createTunnelCurves } from "./curve-utils";
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
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(0.5, 0.5, 0.5),
      wireframe: true,
      side: THREE.BackSide,
    });
    for (const tunnel of metro.tunnels) {
      const curves = createTunnelCurves(tunnel, 0.3);
      const curveMeshes = [];
      for (const curve of curves) {
        const geometry = this.#tunnelSegmentFactory.createShellGeometry(curve);
        const mesh = new THREE.Mesh(geometry, material);

        curveMeshes.push(mesh);
        this.#scene.add(mesh);
      }
      this.#tunnels.push(curveMeshes);
    }
  }
}
