"use strict";
import { Vector3, Scene, WebGLRenderer, PerspectiveCamera, Euler, HemisphereLight } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { Metro } from "./src/domain/Metro";

import { MetroRenderer } from "./src/rendering/MetroRenderer";

import { createTunnelManager } from "./src/examples/tunnels/tunnel-style-1";
import { createMetro } from "./src/examples/metro-1";

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
camera.position.set(100, 20, 20);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(100, 10, 0);
controls.enableDamping = true;
controls.minDistance = 10;
controls.maxDistance = 2000;

//light
const light = new HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

// //importing metro from json file
import * as metroJSON from "./src/examples/metro-1.json";
const metro = Metro.fromJSON(metroJSON);

// const metro = createMetro();

const tunnelRender = new MetroRenderer(scene, createTunnelManager());
tunnelRender.render(metro);
