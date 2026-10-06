import * as THREE from "three";
import { Metro } from "../domain/Metro";
import { createTunnelCurves } from "./curve-utils";
import { TunnelSegmentBuilder } from "./TunnelSegmentBuilder";

export class SimpleTubeTunnelRenderer {
  #scene;
  #tunnels = [];
  #tunnelBuilder;

  /**
   *
   * @param {THREE.Scene} scene
   * @param {TunnelSegmentBuilder} tunnelBuilder
   */
  constructor(scene, tunnelBuilder) {
    this.#scene = scene;
    this.tunnelBuilder = tunnelBuilder;
  }

  render(metro) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(0.5, 0.5, 0.5),
      wireframe: true,
    });
    for (const tunnel of metro.tunnels) {
      const curves = createTunnelCurves(tunnel, 0.3);
      const curveMeshes = [];
      for (const curve of curves) {
        const geometry = this.tunnelBuilder.buildShellGeometry(curve);
        const mesh = new THREE.Mesh(geometry, material);

        curveMeshes.push(mesh);
        this.#scene.add(mesh);
      }
      this.#tunnels.push(curveMeshes);
    }
  }
}
