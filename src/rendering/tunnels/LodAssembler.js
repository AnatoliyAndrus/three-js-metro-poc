import { LOD } from "three";

export class LodAssembler {
  constructor(levels) {
    this.levels = levels;
  }

  create(buildLevel) {
    const lod = new LOD();

    for (const level of this.levels) {
      lod.addLevel(buildLevel(level.id), level.distance);
    }

    return lod;
  }
}
