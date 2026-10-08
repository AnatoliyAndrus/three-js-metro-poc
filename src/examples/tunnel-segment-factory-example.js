import { BoxGeometry, Color, Vector2 } from "three";
import { TunnelSegmentFactory } from "../rendering/TunnelSegmentFactory";
import { MeshBasicMaterial } from "three";

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
    material: new MeshBasicMaterial({
      color: new Color().setRGB(0.3, 0.3, 0.5),
      wireframe: true,
    }),
  };

  factory.sleepers = {
    resolution: 5,
    geometry: new BoxGeometry(0.7, 0.05, 0.1),
    material: new MeshBasicMaterial({
      color: new Color().setRGB(0.3, 0.1, 0.0),
      wireframe: true,
    }),
    profilePoint: new Vector2(0, 0.025),
  };

  factory.floorMaterial = new MeshBasicMaterial({
    color: new Color().setRGB(0.5, 0.5, 0.5),
    wireframe: true,
  });

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
    material: new MeshBasicMaterial({
      color: new Color().setRGB(0.5, 0.2, 0.2),
      wireframe: true,
    }),
    offset: new Vector2(0, 0),
    distanceBetween: 0.5,
  };

  return factory;
}
