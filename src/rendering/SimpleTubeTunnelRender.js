import * as THREE from "three";
import { Metro } from "../domain/Metro";
import { createTunnelCurves } from "./curve-utils";

export class SimpleTubeTunnelRenderer {
  #scene;
  #tunnels = [];

  /**
   *
   * @param {THREE.Scene} scene
   * @param {Metro} metro
   */
  constructor(scene) {
    this.#scene = scene;
  }

  render(metro) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(0.5, 0.5, 0.5),
      side: THREE.BackSide,
      wireframe: true,
      м,
    });
    for (const tunnel of metro.tunnels) {
      const curves = createTunnelCurves(tunnel, 0.3);
      const curveMeshes = [];
      for (const curve of curves) {
        const geometry = new THREE.TubeGeometry(curve, 64, 1, 8);
        const mesh = new THREE.Mesh(geometry, material);

        curveMeshes.push(mesh);
        this.#scene.add(mesh);
      }
      this.#tunnels.push(curveMeshes);
    }
  }
}
