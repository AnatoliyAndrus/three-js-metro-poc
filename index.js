"use strict";
import { Scene, WebGLRenderer, PerspectiveCamera, HemisphereLight, Clock } from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Metro } from "./src/domain/Metro";
import { MetroRenderer } from "./src/rendering/MetroRenderer";
import { createTunnelManager } from "./src/examples/tunnels/tunnel-style-1";

const container = document.querySelector(".sceneContainer");

const scene = new Scene();
const renderer = new WebGLRenderer({ antialias: true });
const canvas = renderer.domElement;
canvas.style.display = "block";
const width = container.clientWidth;
const height = container.clientHeight;
renderer.setSize(width, height);
container.append(canvas);
const camera = new PerspectiveCamera(60, width / height, 0.1, 10_000);
camera.position.set(0, 0.9, 0);
const controls = new PointerLockControls(camera, renderer.domElement);
const clock = new Clock();
const move = { forward: false, backward: false, left: false, right: false, up: false, down: false };
const movementSpeed = 10;

renderer.domElement.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => console.info("Pointer locked. Move: WASD, look: mouse, unlock: Esc"));

document.addEventListener("keydown", (event) => {
  if (event.code === "KeyW" || event.code === "ArrowUp") move.forward = true;
  if (event.code === "KeyS" || event.code === "ArrowDown") move.backward = true;
  if (event.code === "KeyA" || event.code === "ArrowLeft") move.left = true;
  if (event.code === "KeyD" || event.code === "ArrowRight") move.right = true;
  if (event.code === "Space") {
    event.preventDefault();
    move.up = true;
  }
  if (event.code === "ControlLeft" || event.code === "ControlRight") move.down = true;
});

document.addEventListener("keyup", (event) => {
  if (event.code === "KeyW" || event.code === "ArrowUp") move.forward = false;
  if (event.code === "KeyS" || event.code === "ArrowDown") move.backward = false;
  if (event.code === "KeyA" || event.code === "ArrowLeft") move.left = false;
  if (event.code === "KeyD" || event.code === "ArrowRight") move.right = false;
  if (event.code === "Space") move.up = false;
  if (event.code === "ControlLeft" || event.code === "ControlRight") move.down = false;
});

//light
const light = new HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05);
  if (controls.isLocked) {
    const distance = movementSpeed * delta;
    if (move.forward) controls.moveForward(distance);
    if (move.backward) controls.moveForward(-distance);
    if (move.left) controls.moveRight(-distance);
    if (move.right) controls.moveRight(distance);
    if (move.up) camera.position.y += distance;
    if (move.down) camera.position.y -= distance;
  }
  renderer.render(scene, camera);
});

// importing metro from json file
import * as metroJSON from "./src/examples/metro-1.json";
const metro = Metro.fromJSON(metroJSON);

// const metro = createMetro();

const tunnelRender = new MetroRenderer(scene, createTunnelManager());
tunnelRender.render(metro);
