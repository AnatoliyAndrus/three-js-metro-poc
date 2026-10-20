import * as THREE from "three";
import { Metro } from "../domain/Metro";
import { createTunnelCurves } from "./render-utils";
import { TunnelSegmentFactory } from "./TunnelSegmentFactory";
import { JunctionFactory } from "./JunctionFactory";
import { TunnelManager } from "./TunnelManager";

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
