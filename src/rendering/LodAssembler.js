import { LOD } from "three";

/**
 * Builds a THREE.LOD from a shared render profile.
 * The profile owns distances; feature builders own the geometry for each level.
 */
export class LodAssembler {
  constructor(levels) {
    this.levels = levels;
  }

  create(buildLevel) {
    const lod = new LOD();

    for (const level of this.levels) {
      lod.addLevel(buildLevel(level), level.distance);
    }

    return lod;
  }
}
