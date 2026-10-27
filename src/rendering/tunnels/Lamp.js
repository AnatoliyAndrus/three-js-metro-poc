import { BufferGeometry, Group, Light, LOD, Material, Mesh } from "three";
import { LightPool } from "../LightPool";

/**
 * For now, LoD of lamp is managed automatically
 */
export class Lamp extends LOD {
  /**@type {Group} */
  casing;
  /**@type {LightPool} */
  lightPool;
  /**@type {Light} */
  light;
  /**@type {number} */
  #prevLevel;

  /**
   * @param {Group} casing
   * @param {LightPool} lightPool
   */
  constructor(casing, lightPool) {
    super();
    this.casing = casing;
    this.lightPool = lightPool;

    this.#prevLevel = -1;

    const close = new Group();
    close.add(casing.clone());
    this.addLevel(close, 0);

    const mid = new Group();
    mid.add(casing.clone());
    this.addLevel(mid, 20);
  }

  update(camera) {
    super.update(camera);

    const currentLevel = this.getCurrentLevel();
    if (currentLevel !== this.#prevLevel) {
      if (currentLevel === 0) {
        this.light = this.lightPool.aqcuire();
        this.add(this.light);
      } else if (this.#prevLevel === 0) {
        this.remove(this.light);
        this.lightPool.release(this.light);
        this.light = null;
      }

      this.#prevLevel = currentLevel;
    }
  }
}
