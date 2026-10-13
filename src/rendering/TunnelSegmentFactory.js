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

export class TunnelSegmentFactory {
  //profile here is actually only half of profile. For geometry generation it is mirrored (x -> -x)
  /**@type {{profile: Vector2[], resolution: number, material: Material}} */
  shell;
  /**@type {{resolution: number, geometry: BufferGeometry, material: Material, profilePoint: Vector2}} */
  sleepers;
  /**@type {Material} */
  floorMaterial;
  //offset sets position of center between rails, disanceBetween sets distance between rails
  /**@type {{profile: Vector2[], resolution: number, material: Material, offset: Vector2, distanceBetween: number}} */
  rails;
  /**@type {{profilePoint: Vector2, resolution: number, casing: Group, light: Light}} */
  lights;

  /**
   * Method that creates geometry of outer shell of tunnel based on shell.profile and shell.resolution
   * @param {Curve} curve
   * @returns {BufferGeometry}
   */
  #createShellGeometry(curve) {
    const fullShellProfile = [...this.shell.profile];
    for (let i = this.shell.profile.length - 1; i >= 0; i--) {
      fullShellProfile.push(
        new Vector2(-this.shell.profile[i].x, this.shell.profile[i].y),
      );
    }

    return createGeometryAlongCurve(
      fullShellProfile,
      this.shell.resolution,
      curve,
      false,
    );
  }

  /**
   * Create floor geometry of tunnel, based on first point of profile.
   * Uses same resolution as shell
   * @param {*} curve
   */
  #createFloorGeometry(curve) {
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
   * @returns {Group}
   */
  #createLights(curve) {
    const matrices = getMatrixesAlongCurve(
      this.lights.profilePoint,
      this.lights.resolution,
      curve,
    );
    const lamps = new Group();

    for (let matrix of matrices) {
      const lamp = new TunnelLamp(this.lights.casing, this.lights.light);

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
  #createRailsGeometry(curve) {
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
  #createSleepers(curve) {
    return createInstancesAlongCurve(
      this.sleepers.profilePoint,
      this.sleepers.geometry,
      this.sleepers.material,
      this.sleepers.resolution,
      curve,
    );
  }

  /**
   * Creates tunnel with given preferences
   * @param {Curve} curve
   * @returns {Group}
   */
  create(curve) {
    const offsetCurve = new OffsetCurve(curve).offsetToCurveCenter();

    const tunnelSegment = new Group();

    const shell = new Mesh(
      this.#createShellGeometry(offsetCurve),
      this.shell.material,
    );

    const floor = new Mesh(
      this.#createFloorGeometry(offsetCurve),
      this.floorMaterial,
    );

    const railsGeometries = this.#createRailsGeometry(offsetCurve);
    const rails = [
      new Mesh(railsGeometries[0], this.rails.material),
      new Mesh(railsGeometries[1], this.rails.material),
    ];

    const sleepers = this.#createSleepers(offsetCurve);

    const lamps = this.#createLights(offsetCurve);

    tunnelSegment.add(shell);
    tunnelSegment.add(floor);
    tunnelSegment.add(rails[0], rails[1]);
    tunnelSegment.add(sleepers);
    tunnelSegment.add(lamps);

    tunnelSegment.position.copy(offsetCurve.offset.clone().negate());
    return tunnelSegment;
  }
}
