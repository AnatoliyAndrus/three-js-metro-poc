import { InstancedMesh, Material, Group } from "three";
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
} from "./render-utils";
import { Mesh } from "three";

export class TunnelSegmentFactory {
  //number of lights along the curve per unit of length
  /**@type {number} */
  lightsResolution;

  /**@type {{profile: Vector2[], resolution: number, material: Material}} */
  shell;
  /**@type {{resolution: number, geometry: BufferGeometry, material: Material, profilePoint: Vector2}} */
  sleepers;
  /**@type {Material} */
  floorMaterial;

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

  #createLights(curve) {}

  #createRails(curve) {}

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
   * @param {Curve} curve
   * @returns {Group}
   */
  create(curve) {
    const tunnelSegment = new Group();

    const shell = new Mesh(
      this.#createShellGeometry(curve),
      this.shell.material,
    );
    const floor = new Mesh(
      this.#createFloorGeometry(curve),
      this.floorMaterial,
    );
    const sleepers = this.#createSleepers(curve);

    tunnelSegment.add(shell).add(floor).add(sleepers);
    return tunnelSegment;
  }
}
