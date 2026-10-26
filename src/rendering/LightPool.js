import { Light } from "three";

/**
 * Stores and manages light sources
 */
export class LightPool {
  /**
   * @param {Light} lightInstance
   */
  constructor(lightInstance) {
    this.lightInstance = lightInstance;

    this.free = [];
    this.inUse = new Set();
  }

  aqcuire() {
    if (this.free.length > 0) {
      const light = this.free.pop();
      this.inUse.add(light);
      return light;
    } else {
      const newLight = this.lightInstance.clone();
      this.inUse.add(newLight);
      return newLight;
    }
  }

  release(light) {
    if (this.inUse.has(light)) {
      this.inUse.delete(light);
      this.free.push(light);
    }
  }
}
