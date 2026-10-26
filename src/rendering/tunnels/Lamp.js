import { BufferGeometry, Group, Light, LOD, Material, Mesh } from "three";

/**
 * For now, LoD of lamp is managed automatically
 */
export class Lamp extends LOD {
  /**@type {Group} */
  casing;
  /**@type {Light} */
  light;

  /**
   * @param {Group} casing
   * @param {Light} light
   */
  constructor(casing, light) {
    super();
    this.casing = casing;
    this.light = light;

    const close = new Group();
    close.add(casing.clone());
    close.add(this.light.clone());
    this.addLevel(close, 0);

    const mid = new Group();
    mid.add(casing.clone());
    this.addLevel(mid, 20);

    const far = new Group();
    this.addLevel(far, 50);
  }
}
