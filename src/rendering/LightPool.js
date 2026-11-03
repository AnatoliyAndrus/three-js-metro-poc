import { Light } from "three";

/**
 * Stores and manages light sources
 */
export class LightPool {
  /**
   * @param {Light} lightInstance
   * @param {number} initialCount how many light sources will be created initially
   */
  constructor(lightInstance, initialCount = 20) {
    this.lightInstance = lightInstance;

    this.free = [];
    for (let i = 0; i < initialCount; i++) {
      const light = this.lightInstance.clone();
      this.free.push(light);
    }
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
