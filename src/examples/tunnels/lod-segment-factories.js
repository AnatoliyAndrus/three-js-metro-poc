import {
  BackSide,
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  RepeatWrapping,
  TextureLoader,
  Vector2,
} from "three";
import { TunnelSegmentFactory } from "../../rendering/TunnelSegmentFactory";
import { TunnelManager } from "../../rendering/TunnelManager";

export function createDetailedFactory() {
  const ballastTexture = new TextureLoader().load(
    "../resources/textures/ballast.jpg",
  );
  ballastTexture.wrapS = RepeatWrapping;
  ballastTexture.wrapT = RepeatWrapping;
  ballastTexture.repeat.set(0.5, 0.5);

  const factory = new TunnelSegmentFactory();

  factory.shell = {
    profile: [
      new Vector2(1.15, 0),
      new Vector2(1.15, 0.18),
      new Vector2(1.15, 0.38),
      new Vector2(1.12, 0.58),
      new Vector2(1.02, 0.78),
      new Vector2(0.88, 0.96),
      new Vector2(0.68, 1.12),
      new Vector2(0.45, 1.24),
      new Vector2(0.22, 1.3),
      new Vector2(0.05, 1.32),
    ],
    resolution: 2.5,
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.3, 0.3, 0.5),
      side: BackSide,
    }),
  };

  factory.floor = {
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.4, 0.4, 0.4),
      side: BackSide,
      map: ballastTexture,
    }),
  };

  factory.sleepers = {
    resolution: 5,
    geometry: new BoxGeometry(0.7, 0.05, 0.1),
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.3, 0.1, 0),
    }),
    profilePoint: new Vector2(0, 0.025),
  };

  factory.rails = {
    profile: [
      new Vector2(0.04, 0),
      new Vector2(0.04, 0.02),
      new Vector2(0.025, 0.035),
      new Vector2(0.02, 0.055),
      new Vector2(0.025, 0.075),
      new Vector2(0.04, 0.09),
      new Vector2(0.04, 0.11),
    ],
    resolution: 5,
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.5, 0.2, 0.2),
      metalness: 0.7,
      roughness: 0.5,
    }),
    offset: new Vector2(0, 0),
    distanceBetween: 0.5,
  };

  factory.lights = {
    profilePoint: new Vector2(1.08, 0.38),
    resolution: 0.2,
    casing: createLampCasing(),
    light: new PointLight(0xffd6a0, 2, 6, 2),
  };

  return factory;
}

export function createMediumFactory() {
  const factory = new TunnelSegmentFactory();

  factory.shell = {
    profile: [
      new Vector2(1.15, 0),
      new Vector2(1.15, 0.35),
      new Vector2(1.05, 0.72),
      new Vector2(0.78, 1.02),
      new Vector2(0.4, 1.25),
      new Vector2(0, 1.32),
    ],
    resolution: 1.25,
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.3, 0.3, 0.5),
      side: BackSide,
    }),
  };

  factory.floor = {
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.5, 0.5, 0.5),
      side: BackSide,
    }),
  };

  factory.rails = {
    profile: [
      new Vector2(0.04, 0),
      new Vector2(0.04, 0.03),
      new Vector2(0.02, 0.06),
      new Vector2(0.04, 0.09),
    ],
    resolution: 2.5,
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.5, 0.2, 0.2),
      metalness: 0.6,
      roughness: 0.6,
    }),
    offset: new Vector2(0, 0),
    distanceBetween: 0.5,
  };

  return factory;
}

export function createLowFactory() {
  const factory = new TunnelSegmentFactory();

  factory.shell = {
    profile: [
      new Vector2(1.15, 0),
      new Vector2(1.15, 0.48),
      new Vector2(0.92, 0.88),
      new Vector2(0.52, 1.2),
      new Vector2(0, 1.32),
    ],
    resolution: 0.6,
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.3, 0.3, 0.5),
      side: BackSide,
    }),
  };

  return factory;
}

function createLampCasing() {
  const casing = new Group();
  const material = new MeshStandardMaterial({
    color: 0x454b55,
    emissive: 0xffd6a0,
    emissiveIntensity: 0.8,
  });

  const thickness = 0.001;
  const halfSize = 0.04;

  function addWall(width, height, depth, x, y, z) {
    const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    casing.add(mesh);
  }

  addWall(0.06, 0.08, thickness, 0, 0, halfSize);
  addWall(0.06, 0.08, thickness, 0, 0, -halfSize);
  addWall(0.06, thickness, 0.08, 0, halfSize, 0);
  addWall(0.06, thickness, 0.08, 0, -halfSize, 0);

  return casing;
}

/**
 *
 * @returns {TunnelManager}
 */
export function createTunnelManager() {
  const tunnelManager = new TunnelManager(
    createDetailedFactory(),
    createMediumFactory(),
    createLowFactory(),
  );
  tunnelManager.walkingPath = {
    profile: [
      new Vector2(0.55, 0),
      new Vector2(0.55, 0.15),
      new Vector2(0.45, 0.2),
      new Vector2(0.45, 0.25),
      new Vector2(1.15, 0.25),
      new Vector2(1.15, 0),
    ],
    material: new MeshStandardMaterial({
      color: new Color().setRGB(0.1, 0.1, 0.15),
      side: BackSide,
    }),
  };
  return tunnelManager;
}
