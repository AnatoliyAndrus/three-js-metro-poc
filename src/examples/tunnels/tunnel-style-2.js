import {
  BackSide,
  BoxGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  RepeatWrapping,
  Shape,
  TextureLoader,
  Vector2,
  Vector3,
} from "three";
import { EllipticLinedShellFeature } from "../../rendering/tunnels/features/EllipticLinedShellFeature";
import { TunnelStyle } from "../../rendering/tunnels/TunnelStyle";
import { LightsFeature } from "../../rendering/tunnels/features/LightsFeature";
import { LightPool } from "../../rendering/LightPool";
import { TunnelManager } from "../../rendering/tunnels/TunnelManager";
import { FloorFeature } from "../../rendering/tunnels/features/FloorFeature";
import { SleepersFeature } from "../../rendering/tunnels/features/SleepersFeature";
import { RailsFeature } from "../../rendering/tunnels/features/RailsFeature";
import { PipeFeature } from "../../rendering/tunnels/features/PipeFeature";
import { WalkingPathFeature } from "../../rendering/tunnels/features/WalkingPathFeature";
import { FireExitFeature } from "../../rendering/tunnels/features/FireExitFeature";
import { createFireExit } from "./fire-exit-room";
import { VerticalVentilationFeature } from "../../rendering/tunnels/features/VerticalVentilationFeature";

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

  //specs
  const floorOffset = -1.5;
  const xRadius = 2;
  const yRadius = 2;

  const detailedResolution = 2.5;
  const mediumResolution = 1;

  const ellipseEquation = (y) => (Math.abs(y) < yRadius ? Math.sqrt(1 - y ** 2 / yRadius ** 2) * xRadius : 0);
  const floorProfileX = ellipseEquation(floorOffset);

  const linedShellFeature = new EllipticLinedShellFeature({
    xRadius,
    yRadius,
    floorOffset,
    variants: {
      detailed: {
        shell: {
          crossResolution: 2.5,
          resolution: detailedResolution,
          material: new MeshStandardMaterial({
            color: new Color().setRGB(0.3, 0.3, 0.5),
            side: BackSide,
            map: concreteTexture,
          }),
        },
        lining: {
          material: new MeshStandardMaterial({
            color: 0x70412d,
            metalness: 0.75,
            roughness: 0.85,
            flatShading: true,
          }),
          segmentNumber: 8,
          subSegmentsPerSegment: 2,
          segmentWidth: 0.15,
          segmentDepth: 0.2,
          subSegmentWidth: 0.07,
          subSegmentDepth: 0.1,
          crossSegmentWidth: 0.1,
          crossSegmentDepth: 0.2,
          crossSegmentResolution: 1,
        },
      },
      medium: {
        shell: {
          crossResolution: 1,
          resolution: mediumResolution,
          material: new MeshStandardMaterial({
            color: new Color().setRGB(0.3, 0.3, 0.5),
            side: BackSide,
            map: concreteTexture,
          }),
        },
      },
    },
  });

  const floor = new FloorFeature({
    profile: [new Vector2(floorProfileX, floorOffset), new Vector2(-floorProfileX, floorOffset)],
    variants: {
      detailed: {
        resolution: detailedResolution,
        material: new MeshStandardMaterial({
          color: new Color().setRGB(0.4, 0.4, 0.4),
          map: ballastTexture,
        }),
      },
      medium: {
        resolution: mediumResolution,
        material: new MeshStandardMaterial({
          color: new Color().setRGB(0.5, 0.5, 0.5),
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
    offset: new Vector2(0, floorOffset),
    distanceBetween: 0.5,
    variants: {
      detailed: {
        profile: [new Vector2(0.04, 0), new Vector2(0.04, 0.02), new Vector2(0.025, 0.035), new Vector2(0.02, 0.055), new Vector2(0.025, 0.075), new Vector2(0.04, 0.09), new Vector2(0.04, 0.11)],
        resolution: detailedResolution,
        material: railsMaterial,
      },
      medium: {
        profile: [new Vector2(0.04, 0), new Vector2(0.04, 0.03), new Vector2(0.02, 0.06), new Vector2(0.04, 0.09)],
        resolution: mediumResolution,
        material: railsMaterial,
      },
    },
  });

  const sleepers = new SleepersFeature({
    profilePoint: new Vector2(0, 0.025 + floorOffset),
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

  const lightInstance = new PointLight(0xffd6a0, 3, 10, 1);
  const lights = new LightsFeature({
    lightPool: new LightPool(lightInstance),
    variants: {
      detailed: {
        profilePoint: new Vector2(xRadius - 0.4, 0),
        resolution: 0.1,
        casing: new Mesh(new BoxGeometry(0.2, 0.2, 0.5), new MeshBasicMaterial({ color: new Color(0.7, 0.7, 0.3), emissive: 0xffd6a0, emissiveIntensity: 1.8 })),
      },
    },
  });
  const walkwayMaterial = new MeshStandardMaterial({
    color: new Color().setRGB(0.1, 0.1, 0.15),
  });
  const walkingPath = new WalkingPathFeature({
    profile: [
      new Vector2(xRadius, floorOffset),
      new Vector2(ellipseEquation(0.5 + floorOffset), 0.5 + floorOffset),
      new Vector2(xRadius / 3, 0.5 + floorOffset),
      new Vector2(xRadius / 3, 0.4 + floorOffset),
      new Vector2(xRadius / 3 + 0.1, 0.3 + floorOffset),
      new Vector2(xRadius / 3 + 0.1, floorOffset),
    ],
    range: { startU: 0.2, endU: 0.8 },
    variants: {
      detailed: { resolution: detailedResolution, material: walkwayMaterial },
      medium: { resolution: mediumResolution, material: walkwayMaterial },
      // low: { resolution: 0.6, material: walkwayMaterial },
    },
  });

  const pipeMaterial = new MeshStandardMaterial({
    color: 0x3f4445,
  });
  const fastenerGeometry = new CylinderGeometry(0.2, 0.2, 0.1, 16, 1);
  fastenerGeometry.rotateX(Math.PI / 2);
  const fastenerMaterial = new MeshStandardMaterial({
    color: new Color().setRGB(0.1, 0.15, 0.1),
  });
  const pipeOffsetY = -0.5;
  const pipe1 = new PipeFeature({
    profile: createRoundProfile(0.15, 16),
    isLeft: false,
    offset: new Vector2(-ellipseEquation(pipeOffsetY) + 0.3, pipeOffsetY),
    variants: {
      detailed: {
        resolution: detailedResolution,
        material: pipeMaterial,
        fastener: { geometry: fastenerGeometry, material: fastenerMaterial, resolution: 0.5 },
      },
      medium: {
        resolution: mediumResolution,
        material: pipeMaterial,
      },
    },
  });

  const fireExitYOffset = floorOffset + 0.5;
  const fireExit = new FireExitFeature({
    variants: {
      detailed: {
        entrance: {
          profile: [new Vector2(2, 0), new Vector2(2, 2), new Vector2(-2, 2), new Vector2(-2, 0)],
          material: new MeshStandardMaterial({ color: new Color().setRGB(0.5, 0.5, 0.5), side: BackSide, map: concreteTexture }),
        },
        roomInstance: createFireExit(Math.PI, new Vector3(2, 2, 2)),
      },
    },
    entranceDepth: 3,
    entranceOffset: new Vector2(ellipseEquation(fireExitYOffset) - 0.4, fireExitYOffset),
    roomOffset: new Vector2(ellipseEquation(fireExitYOffset) + 5.3, fireExitYOffset - 0.15),
    range: { startU: 0.1, endU: 0.9 },
  });

  const verticalVentilation = new VerticalVentilationFeature({
    variants: {
      detailed: {
        shaft: {
          profile: createRoundProfile(1, 16),
          resolution: 1,
          material: new MeshStandardMaterial({ color: 0x969696, side: BackSide, map: concreteTexture }),
        },
        fan: {
          scale: 0.4,
          material: new MeshStandardMaterial({ color: 0xcfcfcf, metalness: 0.3, roughness: 0.5 }),
        },
      },
    },
    range: { startU: 0.2, endU: 1 },
    spacing: 70,
    minLength: 50,
    shaftHeight: 8,
    shaftOffset: new Vector2(0, yRadius / 2),
  });

  return new TunnelStyle({
    segmentLength: 25,
    lodLevels: [
      { id: "detailed", distance: 0 },
      { id: "medium", distance: 50 },
      { id: "low", distance: 100 },
    ],
    segmentFeatures: [linedShellFeature, floor, lights, rails, sleepers, pipe1],
    tunnelFeatures: [walkingPath, fireExit, verticalVentilation],
  });
}

export function createTunnelManager() {
  return new TunnelManager(createTunnelStyle());
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

function createRoundProfile(radius, numberOfPoints) {
  const points = [];

  for (let i = 0; i < numberOfPoints; i++) {
    const angle = (i * Math.PI * 2) / numberOfPoints;
    points.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return points;
}
