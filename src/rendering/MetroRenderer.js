import * as THREE from "three";
import { Metro } from "../domain/Metro";
import { TunnelManager } from "./tunnels/TunnelManager";

export class MetroRenderer {
  #scene;
  #tunnelManager;

  /**
   *
   * @param {THREE.Scene} scene
   * @param {TunnelManager} tunnelManager
   */
  constructor(scene, tunnelManager) {
    this.#scene = scene;
    this.#tunnelManager = tunnelManager;
  }

  /**
   *
   * @param {Metro} metro
   */
  render(metro) {
    this.#scene.add(this.#tunnelManager.createTunnels(metro));
  }
}
