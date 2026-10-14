import { Group, InstancedMesh, Mesh } from "three";

export class TunnelSegment extends Group {
  shell;
  floor;
  rails;
  sleepers;
  lights;

  curve;

  /**
   *
   * @param {Mesh} shell
   */
  addShell(shell) {
    this.add(shell);
    this.shell = shell;
  }

  /**
   *
   * @param {Mesh} floor
   */
  addFloor(floor) {
    this.add(floor);
    this.floor = floor;
  }

  /**
   *
   * @param {Mesh[]} rails
   */
  addRails(rails) {
    for (let rail of rails) this.add(rail);
    this.rails = rails;
  }

  /**
   *
   * @param {InstancedMesh} sleepers
   */
  addSleepers(sleepers) {
    this.sleepers = sleepers;
    this.add(sleepers);
  }

  /**
   *
   * @param {Group} lights
   */
  addLights(lights) {
    this.lights = lights;
    this.add(lights);
  }
}
