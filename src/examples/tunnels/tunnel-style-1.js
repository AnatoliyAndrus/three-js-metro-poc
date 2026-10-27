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
  MeshBasicMaterial,
  CylinderGeometry,
  Shape,
  ExtrudeGeometry,
} from "three";
import { TunnelManager } from "../../rendering/tunnels/TunnelManager";
import { TunnelStyle } from "../../rendering/tunnels/TunnelStyle";
import { ShellFeature } from "../../rendering/tunnels/features/ShellFeature";
import { FloorFeature } from "../../rendering/tunnels/features/FloorFeature";
import { WalkingPathFeature } from "../../rendering/tunnels/features/WalkingPathFeature";
import { RailsFeature } from "../../rendering/tunnels/features/RailsFeature";
import { SleepersFeature } from "../../rendering/tunnels/features/SleepersFeature";
import { LightsFeature } from "../../rendering/tunnels/features/LightsFeature";
import { LightPool } from "../../rendering/LightPool";
import { PipeFeature } from "../../rendering/tunnels/features/PipeFeature";

/** Example style with one set of features providing all LOD variants. */
export function createTunnelStyle() {
  const loader = new TextureLoader();
  const ballastTexture = loader.load("../resources/textures/ballast.jpg");
  ballastTexture.wrapS = RepeatWrapping;
  ballastTexture.wrapT = RepeatWrapping;
  ballastTexture.repeat.set(0.5, 0.5);

  const concreteTexture = loader.load("../resources/textures/concrete.jpg");
  concreteTexture.wrapS = RepeatWrapping;
  concreteTexture.wrapT = RepeatWrapping;
  concreteTexture.repeat.set(0.5, 0.5);

  const shell = new ShellFeature({
    variants: {
      detailed: {
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
          map: concreteTexture,
        }),
      },
      medium: {
        profile: [new Vector2(1.15, 0), new Vector2(1.15, 0.35), new Vector2(1.05, 0.72), new Vector2(0.78, 1.02), new Vector2(0.4, 1.25), new Vector2(0, 1.32)],
        resolution: 1.25,
        material: new MeshStandardMaterial({
          color: new Color().setRGB(0.3, 0.3, 0.5),
          side: BackSide,
        }),
      },
      low: {
        profile: [new Vector2(1.15, 0), new Vector2(1.15, 0.48), new Vector2(0.92, 0.88), new Vector2(0.52, 1.2), new Vector2(0, 1.32)],
        resolution: 0.6,
        material: new MeshStandardMaterial({
          color: new Color().setRGB(0.3, 0.3, 0.5),
          side: BackSide,
        }),
      },
    },
  });

  const floor = new FloorFeature({
    profile: [new Vector2(-1.15, 0), new Vector2(1.15, 0)],
    variants: {
      detailed: {
        resolution: 2.5,
        material: new MeshStandardMaterial({
          color: new Color().setRGB(0.4, 0.4, 0.4),
          side: BackSide,
          map: ballastTexture,
        }),
      },
      medium: {
        resolution: 1.25,
        material: new MeshStandardMaterial({
          color: new Color().setRGB(0.5, 0.5, 0.5),
          side: BackSide,
        }),
      },
    },
  });

  const railsMaterial = new MeshStandardMaterial({
    color: 0x615e5a,
    metalness: 0.7,
    roughness: 0.5,
  });
  const rails = new RailsFeature({
    offset: new Vector2(0, 0),
    distanceBetween: 0.5,
    variants: {
      detailed: {
        profile: [new Vector2(0.04, 0), new Vector2(0.04, 0.02), new Vector2(0.025, 0.035), new Vector2(0.02, 0.055), new Vector2(0.025, 0.075), new Vector2(0.04, 0.09), new Vector2(0.04, 0.11)],
        resolution: 5,
        material: railsMaterial,
      },
      medium: {
        profile: [new Vector2(0.04, 0), new Vector2(0.04, 0.03), new Vector2(0.02, 0.06), new Vector2(0.04, 0.09)],
        resolution: 2.5,
        material: railsMaterial,
      },
    },
  });

  const sleepers = new SleepersFeature({
    profilePoint: new Vector2(0, 0.025),
    variants: {
      detailed: {
        resolution: 5,
        geometry: createSleeperGeometry(),
        material: new MeshStandardMaterial({
          color: 0x909396,
        }),
      },
    },
  });

  const lightInstance = new PointLight(0xffd6a0, 2, 6, 2);

  const lights = new LightsFeature({
    lightPool: new LightPool(lightInstance),
    variants: {
      detailed: {
        profilePoint: new Vector2(1.08, 0.38),
        resolution: 0.2,
        casing: createLampCasing(),
        lodLevels: [
          { id: "near", distance: 0 },
          { id: "middle", distance: 20 },
          { id: "far", distance: 50 },
        ],
      },
    },
  });

  const walkwayMaterial = new MeshStandardMaterial({
    color: new Color().setRGB(0.1, 0.1, 0.15),
    side: BackSide,
  });
  const walkingPath = new WalkingPathFeature({
    profile: [new Vector2(0.55, 0), new Vector2(0.55, 0.15), new Vector2(0.45, 0.2), new Vector2(0.45, 0.25), new Vector2(1.15, 0.25), new Vector2(1.15, 0)],
    range: { startU: 0.2, endU: 0.8 },
    variants: {
      detailed: { resolution: 2.5, material: walkwayMaterial },
      medium: { resolution: 1.25, material: walkwayMaterial },
      // low: { resolution: 0.6, material: walkwayMaterial },
    },
  });

  const pipeMaterial = new MeshStandardMaterial({
    color: 0x545961,
  });
  const fastenerGeometry = new CylinderGeometry(0.1, 0.1, 0.05, 16, 1);
  fastenerGeometry.rotateX(Math.PI / 2);
  const fastenerMaterial = new MeshStandardMaterial({
    color: new Color().setRGB(0.1, 0.15, 0.1),
  });
  const pipe1 = new PipeFeature({
    profile: createRoundProfile(0.07, 16),
    isLeft: false,
    offset: new Vector2(-1, 0.7),
    variants: {
      detailed: {
        resolution: 2.5,
        material: pipeMaterial,
        fastener: { geometry: fastenerGeometry, material: fastenerMaterial, resolution: 0.5 },
      },
      medium: {
        resolution: 0.5,
        material: pipeMaterial,
      },
    },
  });

  const pipe2 = new PipeFeature({
    profile: createRoundProfile(0.07, 16),
    isLeft: false,
    offset: new Vector2(-0.95, 0.85),
    variants: {
      detailed: {
        resolution: 2.5,
        material: pipeMaterial,
        fastener: { geometry: fastenerGeometry, material: fastenerMaterial, resolution: 0.5 },
      },
      medium: {
        resolution: 0.5,
        material: pipeMaterial,
      },
    },
  });

  return new TunnelStyle({
    segmentLength: 25,
    lodLevels: [
      { id: "detailed", distance: 0 },
      { id: "medium", distance: 50 },
      { id: "low", distance: 100 },
    ],
    segmentFeatures: [shell, floor, rails, sleepers, lights, pipe1, pipe2],
    tunnelFeatures: [walkingPath],
  });
}

function createLampCasing() {
  const casing = new Group();
  const material = new MeshBasicMaterial({
    color: new Color(0.7, 0.7, 0.3),
    emissive: 0xffd6a0,
    emissiveIntensity: 1.8,
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

  casing.position.set(0.07, 0, 0);
  return casing;
}

export function createTunnelManager() {
  return new TunnelManager(createTunnelStyle());
}

function createRoundProfile(radius, numberOfPoints) {
  const points = [];

  for (let i = 0; i < numberOfPoints; i++) {
    const angle = (i * Math.PI * 2) / numberOfPoints;
    points.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return points;
}

function createSleeperGeometry() {
  const shape = new Shape([
    new Vector2(-0.35, -0.05),
    new Vector2(-0.35, 0.02),
    new Vector2(-0.3, 0.05),
    new Vector2(-0.15, 0.02),
    new Vector2(0.15, 0.02),
    new Vector2(0.3, 0.05),
    new Vector2(0.35, 0.02),
    new Vector2(0.35, -0.05),
  ]);
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: false,
  });

  return geometry;
}
