import { Group, Light, LOD } from "three";

/**
 * Local lamp detail levels are supplied by the tunnel style.
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
  constructor(
    casing,
    light,
    lodLevels = [
      { id: "near", distance: 0 },
      { id: "middle", distance: 20 },
      { id: "far", distance: 50 },
    ],
  ) {
    super();
    this.casing = casing;
    this.light = light;

    const close = new Group();
    close.add(casing.clone());
    close.add(this.light.clone());
    this.addLevel(close, lodLevels[0]?.distance ?? 0);
    this.levelGroups.push(close);

    const mid = new Group();
    mid.add(casing.clone());
    this.addLevel(mid, lodLevels[1]?.distance ?? 20);
    this.levelGroups.push(mid);

    const far = new Group();
    this.addLevel(far, lodLevels[2]?.distance ?? 50);
    this.levelGroups.push(far);
  }
}
