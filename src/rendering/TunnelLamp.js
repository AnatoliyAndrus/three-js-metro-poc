import { BufferGeometry, Group, Light, LOD, Material, Mesh } from "three";

/**
 * For now, LoD of lamp is managed automatically
 */
export class TunnelLamp extends LOD {
  /**@type {Group} */
  casing;
  /**@type {Light} */
  light;

  /**@type {Group[]} */
  levelGroups = [];

  /**
   * @param {Group} casing
   * @param {Light} light
   */
  constructor(casing, light) {
    super();
    this.casing = casing.clone();
    this.light = light.clone();

    const close = new Group();
    close.add(this.casing);
    close.add(this.light);
    this.addLevel(close, 0);
    this.levelGroups.push(close);

    const mid = new Group();
    mid.add(this.casing);
    this.addLevel(mid, 20);
    this.levelGroups.push(mid);

    const far = new Group();
    this.addLevel(far, 50);
    this.levelGroups.push(far);
  }
}
