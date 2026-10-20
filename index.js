"use strict";
import metroExample from "./src/examples/metro-1.json";
import { testFactory } from "./src/examples/tunnels/segment-factory";
import { Vector3, Scene, WebGLRenderer, PerspectiveCamera, Euler } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Metro } from "./src/domain/Metro";
import { MetroNode } from "./src/domain/MetroNode";
import { Port } from "./src/domain/Port";
import { Tunnel } from "./src/domain/Tunnel";

import { MetroRenderer } from "./src/rendering/MetroRenderer";

const container = document.querySelector(".sceneContainer");

const scene = new Scene();
const renderer = new WebGLRenderer({ antialias: true });
const canvas = renderer.domElement;
canvas.style.display = "block";
const width = container.clientWidth;
const height = container.clientHeight;
renderer.setSize(width, height);
container.append(canvas);
const camera = new PerspectiveCamera(90, width / height, 0.1, 10_000);
camera.position.set(0, 10, 10);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.minDistance = 10;
controls.maxDistance = 2000;

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

// creating our own metro
const station1 = new MetroNode(new Vector3(0, 0, 0));
const station2 = new MetroNode(new Vector3(100, 0, 10));

const station1Port1 = new Port(
  new Vector3(-1, 0, -1),
  new Euler(0, 0, 0),
  station1,
  "to",
);
const station1Port2 = new Port(
  new Vector3(1, 0, -1),
  new Euler(0, 0, 0),
  station1,
  "from",
  [station1Port1],
);

const points = [
  new Vector3(10, 0, 3),
  new Vector3(20, 0.5, 10),
  new Vector3(40, 1, 13),
  new Vector3(50, 1, 15),
  new Vector3(70, 0, 7),
];

const metro = new Metro();
const junction = metro.addJunction(new Vector3(100, 10, 10), 0, [
  { x: 0, z: 0, yRotation: 0, type: "to" },
  { x: 30, z: 5, yRotation: 0, type: "from" },
  { x: 30, z: -5, yRotation: 0, type: "from" },
]);

const tunnel = new Tunnel(
  station1Port2,
  junction.ports.find((port) => port.type == "to"),
  points,
);
metro.tunnels.push(tunnel);

// //importing metro from json file
// const metro = Metro.fromJSON(metroExample);

const tunnelSegmentFactory = new testFactory();

const tunnelRender = new MetroRenderer(scene, tunnelSegmentFactory);
tunnelRender.render(metro);
