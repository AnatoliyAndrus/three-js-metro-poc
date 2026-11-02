import { LineCurve3, Vector3, Vector2, Material, DoubleSide, MeshBasicMaterial, Curve, Matrix4, Group } from "three";
import { createGeometryAlongCurve, getProfileGlobalPoints, getCurveFrame } from "../tunnel-utils";
import { SideConnectedFeature } from "./SideConnectedFeature";
import { Brush, Evaluator, HOLLOW_SUBTRACTION } from "three-bvh-csg";

/**
 * Represents fire exit room with entrance to the tunnel
 * Is tunnel feature
 */
export class FireExitFeature extends SideConnectedFeature {
  name = "fireExit";
  /**
   * Use range to limit part of tunnel where fire exits will be generated
   * Use spacing to define distance between fire exits
   * Use minLength to define minimal length of curve segment, limited by range, where at least one fire exit would be generated
   *
   * Use entranceDepth to define, how deep is entrance, entranceOffset - to move its position relative to center of curve, roomOffset - to move position of fire exit room.
   */
  constructor({ variants, range = { startU: 0, endU: 1 }, spacing = 50, minLength = 50, entranceDepth = 1, entranceOffset = new Vector2(0, 0), roomOffset = new Vector2(0, 0) }) {
    super({ variants: { ...variants } });
    this.range = range;
    this.spacing = spacing;
    this.minLength = minLength;
    this.entranceDepth = entranceDepth;
    this.entranceOffset = entranceOffset;
    this.roomOffset = roomOffset;

    for (let lodLevel of Object.keys(this.variants)) {
      if (this.variants[lodLevel].entrance) {
        const line = new LineCurve3(new Vector3(0, 0, 0), new Vector3(entranceDepth, 0, 0));
        this.variants[lodLevel].entrance = { ...this.variants[lodLevel].entrance, geometry: createGeometryAlongCurve(this.variants[lodLevel].entrance.profile, 0, line, true, true, false) };
        this.variants[lodLevel] = { ...this.variants[lodLevel], cutterGeometry: createGeometryAlongCurve(this.variants[lodLevel].entrance.profile, 0, line, true, true, true) };
      }
    }
  }

  createCutter(lodLevel) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    return new Brush(variant.cutterGeometry, new MeshBasicMaterial({ side: DoubleSide }));
  }

  createConnectionMatrices(curve, options) {
    return this.#createMatrices(curve, this.entranceOffset, options);
  }
  /**
   * Method that creates matrices along curve, which represent where to place entrances, rooms or where to place cutters to get holes in form of entrances
   * @param {Curve} curve
   * @param {Vector2} offset
   * @param {object} options
   *
   * @returns {{matrix: Matrix4, u: number}} matrix and u on curve
   */
  #createMatrices(curve, offset, options) {
    const rangeLength = (this.range.endU - this.range.startU) * curve.getLength();
    if (rangeLength < this.minLength) return [];

    const startU = Math.max(options.startU, this.range.startU);
    const endU = Math.min(options.endU, this.range.endU);

    if (endU - startU < 1e-9) return [];

    let uArray = [];
    const uStep = this.spacing / curve.getLength();
    for (let i = this.range.startU; i < this.range.endU; i += uStep) {
      uArray.push(i);
    }
    uArray = uArray.filter((u) => u >= startU && u < endU);

    const matrices = [];

    for (let u of uArray) {
      const globalPoint = getProfileGlobalPoints([offset], u, curve)[0];
      const frame = getCurveFrame(u, curve);
      const matrix = new Matrix4();
      matrix.makeBasis(frame.side, frame.localUp, frame.tangent);
      matrix.setPosition(globalPoint);
      matrices.push({ matrix: matrix, u: u });
    }

    return matrices;
  }

  buildSegment(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const fireExits = new Group();

    if (variant.entrance) {
      const entranceMatrices = this.createConnectionMatrices(curve, options);
      if (entranceMatrices.length === 0) return null;

      for (let { matrix } of entranceMatrices) {
        let entrance = new Brush(variant.entrance.geometry, variant.entrance.material);
        matrix.decompose(entrance.position, entrance.quaternion, entrance.scale);
        entrance.updateMatrix();
        entrance.updateMatrixWorld(true);

        if (options.shellCutterSelf) {
          const temp = new Evaluator().evaluate(entrance, options.shellCutterSelf, HOLLOW_SUBTRACTION);

          entrance.geometry.dispose();

          entrance.geometry = temp.geometry;
        }

        fireExits.add(entrance);
      }
    }

    if (variant.roomInstance) {
      const roomMatrices = this.#createMatrices(curve, this.roomOffset, options);

      for (let { matrix } of roomMatrices) {
        const room = variant.roomInstance.clone();
        matrix.decompose(room.position, room.quaternion, room.scale);
        room.updateMatrix();

        fireExits.add(room);
      }
    }
    return fireExits;
  }

  buildJunction(curve, lodLevel, options) {
    return null;
  }
}
