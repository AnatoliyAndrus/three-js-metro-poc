import { Group } from "three";

/** Builds junction branches using the same segment feature set as tunnel chunks. */
export class JunctionFactory {
  constructor(style, featureAssembler) {
    this.featureAssembler = featureAssembler;
    this.shellFeature = style.segmentFeatures.find(
      (feature) => feature.id === "shell" && feature.createCutter,
    );

    if (!this.shellFeature?.hasVariant) {
      throw new Error(
        "Tunnel style requires a shell feature with a junction cutter",
      );
    }

    const missingLevels = style.lodLevels
      .filter((level) => !this.shellFeature.hasVariant(level.id))
      .map((level) => level.id);
    if (missingLevels.length > 0) {
      throw new Error(
        `Shell feature is missing LOD variants: ${missingLevels.join(", ")}`,
      );
    }
  }

  create(curve1, curve2, lodLevel) {
    const cutter1 = this.shellFeature.createCutter(curve1, lodLevel);
    const cutter2 = this.shellFeature.createCutter(curve2, lodLevel);

    const segment1 = this.featureAssembler.buildJunctionSegment({
      curve: curve1,
      lodLevel,
      junction: {
        branchIndex: 0,
        ownCutter: cutter1,
        peerCutter: cutter2,
        peerCurve: curve2,
      },
    });
    const segment2 = this.featureAssembler.buildJunctionSegment({
      curve: curve2,
      lodLevel,
      junction: {
        branchIndex: 1,
        ownCutter: cutter2,
        peerCutter: cutter1,
        peerCurve: curve1,
      },
    });

    return new Group().add(segment1, segment2);
  }
}
