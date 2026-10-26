import { Group, Object3D } from "three";

export class Segment extends Group {
  constructor(curve = null) {
    super();
    this.curve = curve;
    //containg map of names and list of objects of given feature name
    this.featureObjects = new Map();
  }

  /**
   *
   * @param {number} name
   * @param {Object3D} object
   * @returns
   */
  addFeature(name, object) {
    if (!object) return null;

    if (!this.featureObjects.has(name)) {
      this.featureObjects.set(name, []);
    }

    this.featureObjects.get(name).push(object);
    this.add(object);
    return this;
  }
}
