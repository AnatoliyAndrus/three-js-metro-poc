import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, CylinderGeometry, Color, Vector3 } from "three";

/**
 * Creates a small fire-exit room. The tunnel opening is on the positive X side;
 * the closed door is on the opposite wall.
 */
export function createFireExit(rotationY = 0, scale = new Vector3(1, 1, 1)) {
  const room = new Group();
  room.name = "FireExitRoom";

  const width = 2.7;
  const height = 1.2;
  const depth = 3.5;
  const wallThickness = 0.1;
  const floorTop = wallThickness;

  const concrete = new MeshStandardMaterial({ color: 0x777b78, roughness: 0.92 });
  const innerConcrete = new MeshStandardMaterial({ color: 0x969993, roughness: 0.9 });
  const floorMaterial = new MeshStandardMaterial({ color: 0x555955, roughness: 0.95 });
  const trimMaterial = new MeshStandardMaterial({ color: 0x424744, roughness: 0.82 });
  const doorMaterial = new MeshStandardMaterial({ color: new Color().setRGB(0.3, 0.1, 0.1), roughness: 0.8 });
  const doorInsetMaterial = new MeshStandardMaterial({ color: new Color().setRGB(0.2, 0.05, 0.05), roughness: 0.85 });
  const metalMaterial = new MeshStandardMaterial({ color: 0x777f80, metalness: 0.72, roughness: 0.34 });
  const cabinetMaterial = new MeshStandardMaterial({ color: 0x174b7a, roughness: 0.65 });
  const cabinetFaceMaterial = new MeshStandardMaterial({ color: 0x286c9d, roughness: 0.62 });
  const lampMaterial = new MeshBasicMaterial({ color: 0xffe5a6 });

  function addBox(name, size, position, material, parent = room) {
    const mesh = new Mesh(new BoxGeometry(size[0], size[1], size[2]), material);
    mesh.name = name;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Floor, ceiling and the three solid walls.
  addBox("Floor", [width, wallThickness, depth], [0, wallThickness / 2, 0], floorMaterial);
  addBox("Ceiling", [width, wallThickness, depth], [0, height - wallThickness / 2, 0], concrete);
  addBox("LeftWall", [wallThickness, height, depth], [-width / 2 + wallThickness / 2, height / 2, 0], innerConcrete);
  addBox("BackWall", [width, height, wallThickness], [0, height / 2, -depth / 2 + wallThickness / 2], innerConcrete);
  addBox("FrontWall", [width, height, wallThickness], [0, height / 2, depth / 2 - wallThickness / 2], innerConcrete);

  // The tunnel-facing wall is built around a doorway on the positive X side.
  const openingWidth = 0.52;
  const openingHeight = 1;
  const entranceX = width / 2 - wallThickness / 2;
  const sideDepth = (depth - openingWidth) / 2;
  addBox("EntranceWallBack", [wallThickness, height, sideDepth], [entranceX, height / 2, -depth / 2 + sideDepth / 2], concrete);
  addBox("EntranceWallFront", [wallThickness, height, sideDepth], [entranceX, height / 2, depth / 2 - sideDepth / 2], concrete);
  addBox("EntranceLintel", [wallThickness, height - openingHeight, openingWidth], [entranceX, openingHeight + (height - openingHeight) / 2, 0], concrete);

  // Thick reveals make the opening read as a passage through the wall.
  const revealMaterial = new MeshStandardMaterial({ color: 0x626763, roughness: 0.9 });
  addBox("EntranceRevealBack", [wallThickness + 0.015, openingHeight, 0.05], [entranceX, openingHeight / 2, -openingWidth / 2 - 0.0225], revealMaterial);
  addBox("EntranceRevealFront", [wallThickness + 0.015, openingHeight, 0.05], [entranceX, openingHeight / 2, openingWidth / 2 + 0.0225], revealMaterial);
  addBox("EntranceRevealTop", [wallThickness + 0.015, 0.045, openingWidth], [entranceX, openingHeight - 0.0225, 0], revealMaterial);

  // A smaller closed, panelled door on the wall opposite the tunnel entrance.
  const doorWidth = 0.45;
  const doorHeight = 0.89;
  const doorCenterY = floorTop + doorHeight / 2;
  const doorX = -width / 2 + wallThickness + 0.018;
  addBox("ClosedDoor", [0.045, doorHeight, doorWidth], [doorX, doorCenterY, -depth / 4], doorMaterial);
  const doorFaceX = doorX + 0.045 / 2 + 0.008;
  addBox("DoorUpperPanel", [0.018, 0.28, 0.31], [doorFaceX, doorCenterY + 0.23, -depth / 4], doorInsetMaterial);
  addBox("DoorLowerPanel", [0.018, 0.26, 0.31], [doorFaceX, doorCenterY - 0.2, -depth / 4], doorInsetMaterial);

  const frameX = doorX + 0.04;
  addBox("DoorFrameBack", [0.065, doorHeight + 0.09, 0.055], [frameX, doorCenterY, -doorWidth / 2 - 0.045 - depth / 4], trimMaterial);
  addBox("DoorFrameFront", [0.065, doorHeight + 0.09, 0.055], [frameX, doorCenterY, doorWidth / 2 + 0.045 - depth / 4], trimMaterial);
  addBox("DoorFrameTop", [0.065, 0.06, doorWidth + 0.145], [frameX, doorCenterY + doorHeight / 2 + 0.045, 0 - depth / 4], trimMaterial);

  const knob = new Mesh(new SphereGeometry(0.025, 12, 8), metalMaterial);
  knob.name = "DoorKnob";
  knob.position.set(doorFaceX + 0.025, doorCenterY, 0.15 - depth / 4);
  knob.castShadow = true;
  room.add(knob);

  // Two utility pipes run horizontally along the back wall.
  for (const [index, y] of [0.62, 0.88].entries()) {
    const radius = index === 0 ? 0.035 : 0.025;
    const pipe = new Mesh(new CylinderGeometry(radius, radius, width - 0.35, 12), metalMaterial);
    pipe.name = `WallPipe${index + 1}`;
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, y, -depth / 2 + wallThickness + radius);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    room.add(pipe);
  }

  // Two larger blue electrical cabinets stand on the floor against the front wall.
  const cabinetWidth = 0.44;
  const cabinetHeight = 0.72;
  const cabinetDepth = 0.4;
  const cabinetY = floorTop + cabinetHeight / 2;
  const cabinetZ = depth / 2 - wallThickness - cabinetDepth / 2;

  for (const [index, x] of [-0.52, 0.52].entries()) {
    const cabinetFaceZ = cabinetZ - cabinetDepth / 2 - 0.009;
    addBox(`UtilityCabinet${index + 1}`, [cabinetWidth, cabinetHeight, cabinetDepth], [x, cabinetY, cabinetZ], cabinetMaterial);
    addBox(`UtilityCabinetDoor${index + 1}`, [0.34, 0.58, 0.018], [x, cabinetY, cabinetFaceZ], cabinetFaceMaterial);
    addBox(`UtilityCabinetHandle${index + 1}`, [0.025, 0.1, 0.025], [x + 0.14, cabinetY, cabinetFaceZ - 0.02], metalMaterial);
  }

  // A small ceiling light gives the room a finished industrial feel.
  addBox("CeilingLampHousing", [0.32, 0.055, 0.12], [0, height - wallThickness - 0.035, 0.2], trimMaterial);
  addBox("CeilingLamp", [0.26, 0.012, 0.075], [0, height - wallThickness - 0.067, 0.2], lampMaterial);

  const rotationRoom = new Group();
  room.rotateY(rotationY);
  console.log(scale);
  room.scale.copy(scale);
  rotationRoom.add(room);
  return rotationRoom;
}
