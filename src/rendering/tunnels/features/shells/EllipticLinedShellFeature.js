import { EllipseCurve, Vector2, Vector3, DoubleSide, Curve, Mesh, ExtrudeGeometry, Shape, MeshBasicMaterial, Group } from "three/src/Three.Core.js";
import { SymmetricShellFeature } from "./SymmetricShellFeature";
import { createGeometryAlongCurve, getMatricesAlongCurve } from "../../tunnel-utils";
import { Brush, Evaluator, HOLLOW_SUBTRACTION, SUBTRACTION } from "three-bvh-csg";

export class EllipticLinedShellFeature extends SymmetricShellFeature {
  constructor({ variants, xRadius = 1, yRadius = 1, floorOffset = 0 }) {
    super({ variants });

    this.xRadius = xRadius;
    this.yRadius = yRadius;
    //shell start is at this level
    this.floorOffset = floorOffset;

    const startPointX = Math.abs(floorOffset) < yRadius ? Math.sqrt(1 - floorOffset ** 2 / yRadius ** 2) * xRadius : 0;
    const startAngle = startPointX === 0 ? -Math.PI / 2 : Math.atan(floorOffset / startPointX);
    const endAngle = Math.PI - startAngle;

    this.profileEllipse = new EllipseCurve(0, 0, xRadius, yRadius, startAngle, endAngle, false, 0);
  }

  buildSegment(curve, lodLevel, options = {}) {
    return this.#buildSegment(curve, lodLevel, false, true, options);
  }

  buildJunction(curve, lodLevel, options) {
    return this.#buildSegment(curve, lodLevel, true, false, options);
  }

  createCutter(curve, lodLevel, options) {
    if (!this.hasVariant(lodLevel)) return null;

    const cutterGeometry = this.#createEllipseGeometry(curve, lodLevel, { ...options, scale: 0.9999, tube: true, sealedStart: true, sealedEnd: true });

    return new Brush(cutterGeometry, new MeshBasicMaterial({ side: DoubleSide }));
  }

  #createEllipseGeometry(curve, lodLevel, options = {}) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;
    const scale = options.scale ?? 1;

    return createGeometryAlongCurve(
      this.profileEllipse.getSpacedPoints(Math.ceil(variant.shell.crossResolution * this.profileEllipse.getLength())).map((point) => new Vector2(point.x * scale, point.y * scale)),
      variant.shell.resolution,
      curve,
      options.tube,
      options.sealedStart,
      options.sealedEnd,
      options.startU,
      options.endU,
    );
  }

  /**
   *
   * @param {Curve} curve
   * @param {number} lodLevel
   * @param {boolean} cutShell whether to apply shell cutter (used for junctions)
   * @param {boolean} cutSide whether to apply side cutters (used for segments)
   * @param {object} options
   * @returns {Mesh}
   */
  #buildSegment(curve, lodLevel, cutShell = false, cutSide = false, options) {
    const variant = this.getVariant(lodLevel);
    if (!variant) return null;
    const shellWithLining = new Group();

    const applyCutters = (brush, method) => {
      const evaluator = new Evaluator();

      if (cutShell && options.cutter) {
        const temp = evaluator.evaluate(brush, options.cutter, method);
        brush.geometry.dispose();
        brush.geometry = temp.geometry;
      }
      if (cutSide && options.sideCutters) {
        for (let cutterInfo of options.sideCutters) {
          for (let { matrix } of cutterInfo.points) {
            matrix.decompose(cutterInfo.cutter.position, cutterInfo.cutter.quaternion, cutterInfo.cutter.scale);
            cutterInfo.cutter.updateMatrix();
            cutterInfo.cutter.updateMatrixWorld(true);

            const temp = evaluator.evaluate(brush, cutterInfo.cutter, method);
            brush.geometry.dispose();
            brush.geometry = temp.geometry;
          }
        }
      }
      return brush;
    };

    //shell
    const shellGeometry = this.#createEllipseGeometry(curve, lodLevel, options);
    const shell = new Brush(shellGeometry, variant.shell.material);
    shell.name = "shell";

    applyCutters(shell, HOLLOW_SUBTRACTION);
    shellWithLining.add(shell);

    //lining
    if (variant.lining) {
      const lining = new Group();
      lining.name = "lining";
      const segments = new Group();
      segments.name = "segments";
      const subSegments = new Group();
      subSegments.name = "subSegments";
      const crossSegments = new Group();
      crossSegments.name = "crossSegments";

      const pointsNumber = variant.lining.segmentNumber + variant.lining.subSegmentsPerSegment * (variant.lining.segmentNumber - 1);
      const uArr = [];
      for (let i = 0; i < pointsNumber; i++) {
        uArr.push(i / (pointsNumber - 1));
      }

      const createLiningSegment = (width, depth, u) => {
        const tangent = this.profileEllipse.getTangentAt(u).normalize();
        const normal = new Vector2(-tangent.y, tangent.x).normalize();

        const point = this.profileEllipse.getPointAt(u);
        const profile = [
          point.clone().addScaledVector(tangent, width / 2),
          point
            .clone()
            .addScaledVector(tangent, width / 2)
            .addScaledVector(normal, depth),
          point
            .clone()
            .addScaledVector(tangent, -width / 2)
            .addScaledVector(normal, depth),
          point.clone().addScaledVector(tangent, -width / 2),
        ];
        const geometry = createGeometryAlongCurve(profile, variant.shell.resolution, curve, true, true, true, options.startU, options.endU);
        return new Brush(geometry, variant.lining.material);
      };

      for (let i = 0; i < uArr.length; i++) {
        //if it is segment or subsegment
        if (i % (variant.lining.subSegmentsPerSegment + 1) === 0) {
          const liningSegment = createLiningSegment(variant.lining.segmentWidth, variant.lining.segmentDepth, uArr[i]);
          applyCutters(liningSegment, SUBTRACTION);
          segments.add(liningSegment);
        } else {
          const liningSubSegment = createLiningSegment(variant.lining.subSegmentWidth, variant.lining.subSegmentDepth, uArr[i]);
          applyCutters(liningSubSegment, SUBTRACTION);
          subSegments.add(liningSubSegment);
        }
      }

      //cross-lining
      const crossUNumber = Math.ceil(variant.shell.crossResolution * this.profileEllipse.getLength());
      const crossUArray = [];
      for (let i = 0; i < crossUNumber; i++) {
        crossUArray.push(i / (crossUNumber - 1));
      }
      const crossProfile = crossUArray.map((u) => this.profileEllipse.getPointAt(u));
      for (let i = crossUArray.length - 1; i >= 0; i--) {
        const tangent = this.profileEllipse.getTangentAt(crossUArray[i]);
        const normal = new Vector2(-tangent.y, tangent.x);
        crossProfile.push(this.profileEllipse.getPointAt(crossUArray[i]).clone().addScaledVector(normal, variant.lining.crossSegmentDepth));
      }
      const crossGeometry = new ExtrudeGeometry(new Shape(crossProfile), { depth: variant.lining.crossSegmentWidth, bevelEnabled: false });

      getMatricesAlongCurve(new Vector2(0, 0), variant.lining.crossSegmentResolution, curve, options.startU, options.endU).forEach((matrix) => {
        const crossSegment = new Brush(crossGeometry, variant.lining.material);
        matrix.decompose(crossSegment.position, crossSegment.quaternion, crossSegment.scale);
        crossSegment.updateMatrix();
        crossSegment.updateMatrixWorld(true);
        applyCutters(crossSegment, SUBTRACTION);
        crossSegments.add(crossSegment);
      });

      lining.add(segments, subSegments, crossSegments);
      shellWithLining.add(lining);
    }
    return shellWithLining;
  }
}
