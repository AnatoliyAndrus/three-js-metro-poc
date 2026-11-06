import { Noise } from "noisejs";
import { SymmetricShellFeature } from "./SymmetricShellFeature";
import { Curve, Vector3 } from "three";

export class NoiseShellFeature extends SymmetricShellFeature {
  constructor({ variants, seed, frequency, amplitude }) {
    super({ variants });

    this.noise = new Noise(seed ?? Math.floor(Math.random() * 2 ** 32));
    this.frequency = frequency ?? 1;
    this.amplitude = amplitude ?? 1;
  }

  /**
   * @param {Curve} curve
   * @param {number} lodLevel
   * @param {object} options
   * @returns
   */
  createGeometry(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const startU = options.startU ?? 0;
    const endU = options.endU ?? 1;

    const geometry = super.createGeometry(curve, lodLevel, options);

    const positionAttribute = geometry.getAttribute("position");
    const uvAttribute = geometry.getAttribute("uv");

    const profileLength = variant.halfProfile.length * 2;
    const numberOfProfiles = positionAttribute.count / profileLength;

    for (let i = 1; i < numberOfProfiles - 1; i++) {
      const currentU = (i / (numberOfProfiles - 1)) * (endU - startU) + startU;
      const pointOnCurve = curve.getPointAt(currentU);

      //not changing first and last point
      for (let j = 1; j < profileLength - 1; j++) {
        const index = i * profileLength + j;
        const point = new Vector3(positionAttribute.getX(index), positionAttribute.getY(index), positionAttribute.getZ(index));
        const direction = pointOnCurve.clone().sub(point).normalize();

        point.addScaledVector(direction, this.noise.perlin2(uvAttribute.getX(index) * this.frequency, uvAttribute.getY(index) * this.frequency) * this.amplitude);
        positionAttribute.setXYZ(index, point.x, point.y, point.z);
      }
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }
}
