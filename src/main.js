import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer, candle, controls, flame, candleLight;

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e); // Dark blue-purple (evening/night)

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create candle group
  candle = new THREE.Group();

  const waxGeometry = new THREE.CylinderGeometry(0.3, 0.35, 2, 32);
  const waxMaterial = new THREE.MeshPhongMaterial({
    color: 0xfff8dc, // cream color
    shininess: 10,
  });
  const wax = new THREE.Mesh(waxGeometry, waxMaterial);
  candle.add(wax);

  const wickGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
  const wickMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.9,
  });
  const wick = new THREE.Mesh(wickGeometry, wickMaterial);
  wick.position.y = 1.15;
  candle.add(wick);

  const flameGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  flameGeometry.scale(1, 1.5, 1);
  const flameMaterial = new THREE.MeshBasicMaterial({
    color: 0xffa500,
    emissive: 0xff6600,
    emissiveIntensity: 1,
  });
  flame = new THREE.Mesh(flameGeometry, flameMaterial);
  flame.position.y = 1.4;
  candle.add(flame);

  const dripGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const drip = new THREE.Mesh(dripGeometry, waxMaterial);
  drip.position.set(0.25, 0.5, 0);
  drip.scale.set(1, 2, 1);
  candle.add(drip);

  scene.add(candle);

  candleLight = new THREE.PointLight(0xff6600, 2, 10);
  candleLight.position.y = 1.4;
  candle.add(candleLight);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  const secondLight = new THREE.AmbientLight(0x404040);
  scene.add(secondLight);

  const axisHelper = new THREE.AxesHelper(5);
  scene.add(axisHelper);

  camera.position.z = 5;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // smooth camera movement
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 2;
  controls.maxDistance = 10;
}

function animate() {
  requestAnimationFrame(animate);

  if (flame) {
    flame.scale.y = 1.5 + Math.sin(Date.now() * 0.01) * 0.1;
    flame.scale.x = 1 + Math.sin(Date.now() * 0.008) * 0.05;
    flame.position.y = 1.4 + Math.sin(Date.now() * 0.005) * 0.02;
  }

  if (candleLight) {
    candleLight.intensity = 2 + Math.sin(Date.now() * 0.01) * 0.3;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
