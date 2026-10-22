import * as THREE from "three";

export class MetroRenderer {
  #scene;
  #tunnelManager;

  /**
   *
   * @param {THREE.Scene} scene
   * @param {import("./TunnelManager").TunnelManager} tunnelManager
   */
  constructor(scene, tunnelManager) {
    this.#scene = scene;
    this.#tunnelManager = tunnelManager;
  }

  /**
   *
   * @param {import("../domain/Metro").Metro} metro
   */
  render(metro) {
    this.#scene.add(this.#tunnelManager.createTunnels(metro));
  }
}
