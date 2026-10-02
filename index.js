"use strict";
import * as THREE from "three";

let container = document.querySelector(".sceneContainer");

let x = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3);

let att = x.getAttribute("uv");
console.log(att);
