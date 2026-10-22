import { Group } from "three";

export class TunnelSegment extends Group {
  constructor(curve = null) {
    super();
    this.curve = curve;
    this.featureObjects = new Map();
  }

  addFeature(id, object) {
    if (!object) return this;
    if (this.featureObjects.has(id)) {
      throw new Error(`Feature '${id}' was added to this segment twice`);
    }

    let featureObject = object;
    if (Array.isArray(object)) {
      featureObject = new Group();
      for (const child of object) {
        if (child) featureObject.add(child);
      }
    }
    this.featureObjects.set(id, featureObject);
    this.add(featureObject);
    return this;
  }
}
