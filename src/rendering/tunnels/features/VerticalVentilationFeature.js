import { LineCurve3, Vector3, Vector2, Material, DoubleSide, MeshBasicMaterial, Curve, Matrix4, Group, CapsuleGeometry, Shape, ExtrudeGeometry, Mesh } from "three";
import { createGeometryAlongCurve } from "../tunnel-utils";
import { SideConnectedFeature } from "./SideConnectedFeature";
import { Brush, Evaluator, HOLLOW_SUBTRACTION } from "three-bvh-csg";

/**
 * Represents simple vertical ventilation shaft inside tunnel
 * Is tunnel feature
 */
export class VerticalVentilationFeature extends SideConnectedFeature {
  name = "verticalVentilation";
  /**
   * Use range to limit part of tunnel where vertical shafts will be generated
   * Use spacing to define distance between shafts
   * Use minLength to define minimal length of curve segment, limited by range, where at least one shaft would be generated
   *
   * Use shaftHeight to define, how high up the shaft goes, shaftOffset - to move its position relative to center of curve.
   */
  constructor({ variants, range = { startU: 0, endU: 1 }, spacing = 50, minLength = 50, shaftHeight = 7, shaftOffset = new Vector2(0, 0) }) {
    super({ variants: { ...variants } });
    this.range = range;
    this.spacing = spacing;
    this.minLength = minLength;
    this.shaftHeight = shaftHeight;
    this.shaftOffset = shaftOffset;

    for (let lodLevel of Object.keys(this.variants)) {
      if (this.variants[lodLevel].shaft) {
        //createGeometryAlongCurve can't work with vertical lines, so small number is added here
        const line = new LineCurve3(new Vector3(0, 0, 0), new Vector3(0, shaftHeight, 0.000001));
        const geometry = createGeometryAlongCurve(this.variants[lodLevel].shaft.profile, this.variants[lodLevel].shaft.resolution ?? 0, line, true, false, true);
        this.variants[lodLevel].shaft = {
          ...this.variants[lodLevel].shaft,
          geometry,
        };
        const cutterGeometry = createGeometryAlongCurve(this.variants[lodLevel].shaft.profile, this.variants[lodLevel].shaft.resolution ?? 0, line, true, true, true);
        this.variants[lodLevel] = {
          ...this.variants[lodLevel],
          cutterGeometry,
        };
      }
    }
  }

  createCutter(lodLevel) {
    const variant = this.getVariant(lodLevel);
    if (!variant || !variant.cutterGeometry) return null;

    return new Brush(variant.cutterGeometry, new MeshBasicMaterial({ side: DoubleSide }));
  }

  createConnectionMatrices(curve, options) {
    return this.#createMatrices(curve, this.shaftOffset, options);
  }
  /**
   * Method that creates matrices along curve, which represent where to place shafts and cutters
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
      const matrix = new Matrix4();
      const frame = this.#getCurveFrame(curve, u);
      matrix.makeBasis(frame.side, frame.globalUp, frame.tangentHorizontal);
      matrix.setPosition(frame.point.clone().addScaledVector(frame.side, offset.x).addScaledVector(frame.globalUp, offset.y));
      matrices.push({ matrix: matrix, u: u });
    }

    return matrices;
  }

  buildSegment(curve, lodLevel, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;

    const shafts = new Group();

    if (variant.shaft) {
      const shaftMatrices = this.createConnectionMatrices(curve, options);
      if (shaftMatrices.length === 0) return null;

      for (let { matrix } of shaftMatrices) {
        let shaft = new Brush(variant.shaft.geometry, variant.shaft.material);
        matrix.decompose(shaft.position, shaft.quaternion, shaft.scale);
        shaft.updateMatrix();
        shaft.updateMatrixWorld(true);

        if (options.shellCutterSelf) {
          const temp = new Evaluator().evaluate(shaft, options.shellCutterSelf, HOLLOW_SUBTRACTION);
          shaft.geometry.dispose();
          shaft.geometry = temp.geometry;
        }

        shafts.add(shaft);
      }
    }

    if (variant.fan) {
      const fanOffset = new Vector2(this.shaftOffset.x, this.shaftOffset.y + this.shaftHeight - (variant.fan.scale ?? 0) / 2);
      const fanMatrices = this.#createMatrices(curve, fanOffset, options);

      for (let { matrix } of fanMatrices) {
        const fan = this.#createFan(variant.fan.material, variant.fan.scale, 16);
        matrix.decompose(fan.position, fan.quaternion, fan.scale);
        fan.updateMatrix();

        shafts.add(fan);
      }
    }
    return shafts;
  }

  buildJunction(curve, lodLevel, options) {
    return null;
  }

  #createFan(material, scale = 1, bladesCount = 10) {
    const fan = new Group();

    const baseGeometry = new CapsuleGeometry(0.5 * scale, 0.5 * scale, 4, 8, 1);
    const base = new Mesh(baseGeometry, material);
    fan.add(base);

    const bladeShape = new Shape(
      [new Vector2(0.1, 0), new Vector2(1.8, 0), new Vector2(2, 0.1), new Vector2(2, 0.3), new Vector2(1.7, 0.5), new Vector2(0.1, 0.2)].map((v) => v.multiplyScalar(scale)),
    );
    const bladeGeometry = new ExtrudeGeometry(bladeShape, { depth: 0.05 * scale, bevelEnabled: false });
    for (let i = 0; i < bladesCount; i++) {
      const blade = new Mesh(bladeGeometry, material);

      blade.rotateY((Math.PI * 2 * i) / bladesCount);
      blade.rotateX(Math.PI / 3);
      fan.add(blade);
    }

    fan.name = "fan";
    return fan;
  }

  #getCurveFrame(curve, u) {
    // Here coordinate system is created in a slightly different way than in other points in code, because shaft always has to be vertical
    const point = curve.getPointAt(u);
    const globalUp = new Vector3(0, 1, 0);
    const side = new Vector3().crossVectors(globalUp, curve.getTangentAt(u));
    const tangentHorizontal = new Vector3().crossVectors(side, globalUp);

    return { point, side, globalUp, tangentHorizontal };
  }
}
