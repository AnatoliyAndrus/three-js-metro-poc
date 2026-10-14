import {
  BackSide,
  BoxGeometry,
  Color,
  Vector2,
  SpotLight,
  Group,
  MeshStandardMaterial,
  Mesh,
} from "three";
import { TunnelSegmentFactory } from "../rendering/TunnelSegmentFactory";
import { MeshBasicMaterial } from "three";
import { PointLight } from "three";

export function testFactory() {
  const factory = new TunnelSegmentFactory();

  factory.shell = {
    profile: [
      new Vector2(1, 0),
      new Vector2(1, 0.2),
      new Vector2(1, 0.4),
      new Vector2(0.8, 0.6),
      new Vector2(0.8, 0.8),
      new Vector2(0.3, 1),
    ],
    resolution: 1,
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.3, 0.3, 0.5),
      side: BackSide,
      // wireframe: true,
    }),
  };

  factory.sleepers = {
    resolution: 5,
    geometry: new BoxGeometry(0.7, 0.05, 0.1),
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.3, 0.1, 0.0),
      // wireframe: true,
    }),
    profilePoint: new Vector2(0, 0.025),
  };

  factory.floor = {
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.5, 0.5, 0.5),
      side: BackSide,
      // wireframe: true,
    }),
  };

  factory.rails = {
    profile: [
      new Vector2(0.04, 0),
      new Vector2(0.04, 0.02),
      new Vector2(0.02, 0.04),
      new Vector2(0.02, 0.06),
      new Vector2(0.04, 0.08),
      new Vector2(0.04, 0.1),
    ],
    resolution: 5,
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.5, 0.2, 0.2),
      metalness: 0.7,
      roughness: 0.5,
      // wireframe: true,
    }),
    offset: new Vector2(0, 0),
    distanceBetween: 0.5,
  };

  factory.lights = {
    profilePoint: new Vector2(0.96, 0.36),
    resolution: 0.2,
    casing: testLampCasing(),
    light: testLampLight(),
  };

  return factory;
}

function testLampCasing() {
  const box = new Group();

  const material = new MeshStandardMaterial({
    color: 0x454b55,
    emissive: 0xffd6a0,
    emissiveIntensity: 0.8,
  });

  function addWall(width, height, depth, x, y, z) {
    const geometry = new BoxGeometry(width, height, depth);

    const mesh = new Mesh(geometry, material);

    mesh.position.set(x, y, z);
    box.add(mesh);
  }

  const t = 0.001;
  const s = 0.04;

  addWall(0.06, 0.08, t, 0, 0, s);
  addWall(0.06, 0.08, t, 0, 0, -s);
  addWall(0.06, t, 0.08, 0, s, 0);
  addWall(0.06, t, 0.08, 0, -s, 0);

  return box;
}

function testLampLight() {
  const light = new PointLight(0xffd6a0, 2, 6, 2);

  return light;
}
