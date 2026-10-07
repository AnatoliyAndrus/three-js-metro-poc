"use strict";
import data from "./src/examples/tunnel-points-test.json";
import { testFactory } from "./src/examples/tunnel-segment-factory-example";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Metro } from "./src/domain/Metro";
import { MetroNode } from "./src/domain/MetroNode";
import { Port } from "./src/domain/Port";
import { Tunnel } from "./src/domain/Tunnel";

import { SimpleTubeTunnelRenderer } from "./src/rendering/SimpleTubeTunnelRender";
import { TunnelSegmentFactory } from "./src/rendering/TunnelSegmentFactory";

const container = document.querySelector(".sceneContainer");

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const canvas = renderer.domElement;
canvas.style.display = "block";
const width = container.clientWidth;
const height = container.clientHeight;
renderer.setSize(width, height);
container.append(canvas);
const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 10_000);
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

// //creating our own metro
// const station1 = new MetroNode(new Vector3(0, 0, 0));
// const station2 = new MetroNode(new Vector3(100, 0, 10));

// const station1Port = new Port(
//   new Vector3(1, 0, -1),
//   new Euler(0, -0, 0),
//   station1,
//   "out",
// );
// const station2Port = new Port(
//   new Vector3(-1, 0, -1),
//   new Euler(0, 0, 0),
//   station2,
//   "in",
// );

// const points = [
//   new Vector3(10, 0, 3),
//   new Vector3(20, 0.5, 10),
//   new Vector3(40, 1, 13),
//   new Vector3(50, 1, 15),
//   new Vector3(70, 0, 7),
// ];
// const tunnel = new Tunnel(station1Port, station2Port, points);

// const metro = new Metro(
//   [station1, station2],
//   [station1Port, station2Port],
//   [tunnel],
// );
// console.log(metro);
// console.log(JSON.stringify(metro));

//importing metro from json file
const metro = Metro.fromJSON(data);

const tunnelSegmentFactory = new testFactory();

const tunnelRender = new SimpleTubeTunnelRenderer(scene, tunnelSegmentFactory);
tunnelRender.render(metro);
