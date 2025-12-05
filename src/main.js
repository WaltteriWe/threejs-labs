import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRButton} from 'three/examples/jsm/Addons.js';
import {XRControllerModelFactory} from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

let camera, scene, renderer, controls;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
let cameraRig; // Group to position the VR camera
const intersected = [];
const tempMatrix = new THREE.Matrix4();

init();

function loadBackgroundEnvironment() {
  const loader = new GLTFLoader();

  // Load the background environment (untitled.glb)
  loader.load(
    './untitled.glb',
    function (gltf) {
      const backgroundModel = gltf.scene;

      // Scale and position the background environment
      backgroundModel.scale.set(1, 1, 1);
      backgroundModel.position.set(0, 0, 0);

      // Enable shadows for the background
      backgroundModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(backgroundModel);
      console.log('Background environment loaded successfully!');

      // Load winter scene after background is loaded
      loadWinterScene();
    },
    function (xhr) {
      console.log('Background: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    function (error) {
      console.error('Error loading background environment:', error);
    },
  );
}

function loadWinterScene() {
  const loader = new GLTFLoader();

  // Load the winter neighborhood model
  loader.load(
    './winter-scene/malli.gltf',
    function (gltf) {
      const winterModel = gltf.scene;

      // Position winter scene within the background environment
      // Adjust these values to place it in a sensible location
      winterModel.scale.set(0.5, 0.5, 0.5); // Scale down to fit within background
      winterModel.position.set(-7, 2, 0); // Adjust position as needed

      // Enable shadows if needed
      winterModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(winterModel);
      console.log('Winter neighborhood loaded successfully!');
    },
    function (xhr) {
      console.log(
        'Winter scene: ' + (xhr.loaded / xhr.total) * 100 + '% loaded',
      );
    },
    function (error) {
      console.error('Error loading winter scene:', error);
    },
  );
}

function initVR() {
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true;

  // Set reference space for proper VR tracking
  // 'local-floor' places user at standing height with head tracking
  renderer.xr.setReferenceSpaceType('local-floor');

  // Controller 1 (left hand)
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  cameraRig.add(controller1); // Add to camera rig instead of scene

  // Controller 2 (right hand)
  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  cameraRig.add(controller2); // Add to camera rig instead of scene

  // Create controller model factory
  const controllerModelFactory = new XRControllerModelFactory();

  // Add controller grip (3D model of the controller)
  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1),
  );
  cameraRig.add(controllerGrip1); // Add to camera rig

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2),
  );
  cameraRig.add(controllerGrip2); // Add to camera rig

  // Add line/ray visualization for controllers
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
  });

  const line1 = new THREE.Line(geometry, lineMaterial);
  line1.name = 'line';
  line1.scale.z = 5; // Length of the ray
  controller1.add(line1);

  const line2 = new THREE.Line(geometry, lineMaterial);
  line2.name = 'line';
  line2.scale.z = 5;
  controller2.add(line2);

  console.log('VR controllers setup complete');
}

function onSelectStart(event) {
  // Handle controller button press
  const controller = event.target;

  // Perform raycast
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];
    console.log('Hit object:', intersection.object.name || 'unnamed object');
    console.log('Distance:', intersection.distance.toFixed(2));

    // Highlight the intersected object
    const object = intersection.object;
    object.material.emissive.setHex(0xff0000);
    intersected.push(object);
  }
}

function onSelectEnd(event) {
  // Handle controller button release
  const controller = event.target;
  console.log('Controller button released');

  // Reset highlighted objects
  while (intersected.length) {
    const object = intersected.pop();
    object.material.emissive.setHex(0x000000);
  }
}

function getIntersections(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  return raycaster.intersectObjects(scene.children, true);
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    if (object.material && object.material.emissive) {
      object.material.emissive.setHex(0x000000);
    }
  }
}

function init() {
  scene = new THREE.Scene();

  // Winter evening sky color - will be replaced by Unity background later
  scene.background = new THREE.Color(0x87ceeb); // Light blue winter sky
  // Add fog for depth in VR
  scene.fog = new THREE.Fog(0x87ceeb, 10, 100);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  // Create camera rig for VR positioning
  cameraRig = new THREE.Group();
  cameraRig.position.set(0, 0, 0); // Position in middle of street at ground level
  cameraRig.add(camera);
  scene.add(cameraRig);

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Initialize raycaster for controller interactions
  raycaster = new THREE.Raycaster();

  // Initialize VR
  initVR();

  // Load background environment (which will load winter scene after)
  loadBackgroundEnvironment();

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  // Ambient light for winter scene visibility
  const secondLight = new THREE.AmbientLight(0xcccccc, 0.8);
  scene.add(secondLight);

  const axisHelper = new THREE.AxesHelper(5);
  scene.add(axisHelper);

  // Desktop camera position (for overview when using OrbitControls)
  camera.position.set(0, 5, 15); // Back and up for better overview

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // smooth camera movement
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 2;
  controls.maxDistance = 50; // Increased for larger neighborhood scene
  controls.maxPolarAngle = Math.PI / 2; // Prevent going below ground
  controls.enabled = true; // Will be disabled in VR mode
  controls.target.set(0, 1.6, 0); // Look at street level

  // Handle window resize
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  // Use setAnimationLoop for VR compatibility instead of requestAnimationFrame
  renderer.setAnimationLoop(() => {
    // Check if we're in VR mode
    const isInVR = renderer.xr.isPresenting;

    // Disable OrbitControls in VR, enable in desktop
    if (controls) {
      controls.enabled = !isInVR;
      if (!isInVR) {
        controls.update();
      }
    }

    renderer.render(scene, camera);
  });
}

animate();
