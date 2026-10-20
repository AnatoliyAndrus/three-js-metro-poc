import { InstancedMesh, Material, Group, Light } from "three";
import {
  BufferAttribute,
  BufferGeometry,
  Curve,
  Vector2,
  Vector3,
} from "three";
import {
  createGeometryAlongCurve,
  createInstancesAlongCurve,
  getMatrixesAlongCurve,
} from "./render-utils";
import { Mesh } from "three";
import { OffsetCurve } from "./OffsetCurve";
import { TunnelLamp } from "./TunnelLamp";
import { TunnelSegment } from "./TunnelSegment";

export class TunnelSegmentFactory {
  //profile here is actually only half of profile. For geometry generation it is mirrored (x -> -x)
  /**@type {{profile: Vector2[], resolution: number, material: Material}} */
  shell;
  /**@type {{resolution: number, geometry: BufferGeometry, material: Material, profilePoint: Vector2}} */
  sleepers;
  /**@type {{material: Material}} */
  floor;
  //offset sets position of center between rails, disanceBetween sets distance between rails
  /**@type {{profile: Vector2[], resolution: number, material: Material, offset: Vector2, distanceBetween: number}} */
  rails;
  /**@type {{profilePoint: Vector2, resolution: number, casing: Group, light: Light, lod: boolean}} */
  lights;

  /**
   * Method that creates geometry of outer shell of tunnel based on shell.profile and shell.resolution
   * @param {Curve} curve
   * @param {number} scale scales profile points
   * @param {boolean} sealed whether method creates sealed tube. Used for creating cutter
   * @returns {BufferGeometry}
   */
  createShellGeometry(curve, scale = 1, sealed = false) {
    const fullShellProfile = this.shell.profile.map(
      (point) => new Vector2(point.x * scale, point.y * scale),
    );
    for (let i = this.shell.profile.length - 1; i >= 0; i--) {
      fullShellProfile.push(
        new Vector2(
          -this.shell.profile[i].x * scale,
          this.shell.profile[i].y * scale,
        ),
      );
    }

    return createGeometryAlongCurve(
      fullShellProfile,
      this.shell.resolution,
      curve,
      sealed,
      sealed,
    );
  }

  /**
   * Create floor geometry of tunnel, based on first point of profile.
   * Uses same resolution as shell
   * @param {Curve} curve
   * @returns {BufferGeometry}
   */
  createFloorGeometry(curve) {
    const profile = [
      new Vector2(-this.shell.profile[0].x, this.shell.profile[0].y),
      this.shell.profile[0],
    ];
    return createGeometryAlongCurve(
      profile,
      this.shell.resolution,
      curve,
      false,
    );
  }

  /**
   * @param {Curve} curve
   * @param {boolean} lod, if true, creates ligts as LOD objects, otherwise as Group
   * @returns {Group}
   */
  createLights(curve, lod = true) {
    const matrices = getMatrixesAlongCurve(
      this.lights.profilePoint,
      this.lights.resolution,
      curve,
    );
    const lamps = new Group();

    for (let matrix of matrices) {
      let lamp;
      if (lod) {
        lamp = new TunnelLamp(this.lights.casing, this.lights.light);
      } else {
        lamp = new Group();
        lamp.add(this.lights.casing.clone());
        lamp.add(this.lights.light.clone());
      }

      matrix.decompose(lamp.position, lamp.quaternion, lamp.scale);

      lamp.updateMatrix();
      lamps.add(lamp);
    }
    return lamps;
  }

  /**
   *
   * @param {Curve} curve
   * @returns {BufferGeometry[]} geometries for two rails
   */
  createRailsGeometry(curve) {
    const offsetRail1 = this.rails.offset
      .clone()
      .add(new Vector2(this.rails.distanceBetween / 2, 0));
    const offsetRail2 = this.rails.offset
      .clone()
      .add(new Vector2(-this.rails.distanceBetween / 2, 0));

    const createFullProfile = function (profile, offset) {
      const fullProfile = profile.map((point) => point.clone());
      for (let i = profile.length - 1; i >= 0; i--) {
        fullProfile.push(new Vector2(-profile[i].x, profile[i].y));
      }
      for (let i = 0; i < fullProfile.length; i++) {
        fullProfile[i].add(offset);
      }
      return fullProfile;
    };
    const geometryRail1 = createGeometryAlongCurve(
      createFullProfile(this.rails.profile, offsetRail1),
      this.rails.resolution,
      curve,
      true,
    );
    const geometryRail2 = createGeometryAlongCurve(
      createFullProfile(this.rails.profile, offsetRail2),
      this.rails.resolution,
      curve,
      true,
    );
    return [geometryRail1, geometryRail2];
  }

  /**
   * @param {Curve} curve
   * @returns {InstancedMesh}
   */
  createSleepers(curve) {
    return createInstancesAlongCurve(
      this.sleepers.profilePoint,
      this.sleepers.geometry,
      this.sleepers.material,
      this.sleepers.resolution,
      curve,
    );
  }

  /**
   *
   * @param {Curve} curve
   * @returns {Mesh[]}
   */
  createRails(curve) {
    const railsGeometries = this.createRailsGeometry(curve);
    const rails = [
      new Mesh(railsGeometries[0], this.rails.material),
      new Mesh(railsGeometries[1], this.rails.material),
    ];
    return rails;
  }

  /**
   *
   * @param {Curve} curve
   * @returns {Mesh}
   */
  createFloor(curve) {
    const floor = new Mesh(
      this.createFloorGeometry(curve),
      this.floor.material,
    );
    return floor;
  }

  /**
   *
   * @param {Curve} curve
   * @returns {Mesh}
   */
  createShell(curve) {
    const shell = new Mesh(
      this.createShellGeometry(curve),
      this.shell.material,
    );
    return shell;
  }

  /**
   * Creates tunnel with given preferences
   * @param {Curve} curve
   * @returns {TunnelSegment}
   */
  create(curve) {
    const offsetCurve = new OffsetCurve(curve).offsetToCurveCenter();

    const tunnelSegment = new TunnelSegment();

    if (this.shell) tunnelSegment.addShell(this.createShell(offsetCurve));
    if (this.floor) tunnelSegment.addFloor(this.createFloor(offsetCurve));
    if (this.rails) tunnelSegment.addRails(this.createRails(offsetCurve));
    if (this.sleepers)
      tunnelSegment.addSleepers(this.createSleepers(offsetCurve));
    if (this.lights) {
      tunnelSegment.addLights(this.createLights(offsetCurve, this.lights.lod));
    }

    tunnelSegment.curve = curve;

    tunnelSegment.position.copy(offsetCurve.offset.clone().negate());
    return tunnelSegment;
  }
}
