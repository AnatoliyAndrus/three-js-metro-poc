import { Light, LOD, Mesh } from "three";

/**
 * For now, LoD of lamp is managed automatically
 */
export class TunnelLamp extends LOD {
  casing;
  light;

  /**
   * @param {Mesh} casing
   * @param {Light} light
   */
  constructor(casing, light) {
    this.casing = casing;
    this.light = light;
  }
}
