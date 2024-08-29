import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';

let scene, camera, renderer, world, controls;
let spheres = [];
let customModel, customModelBody;
let wireframeCube, wireframeCubeBody;
let wireframeTripod, wireframeTripodBody;
let objects = [];
const SPHERE_COUNT = 10;
let DEPTH = 5;  // Depth of the container will be set dynamically
const SPAWN_INTERVAL = 2000; // 2 seconds
let spawnTimer = 0;
const MAX_OBJECTS = 20; // Adjust this value to determine when to reset

function init() {
  // Three.js setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 10;
  // DEPTH = frustumSize * aspect;  // Set depth to be the same as screen width

  camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2, frustumSize * aspect / 2,
    frustumSize / 2, frustumSize / -2,
    0.1, DEPTH + 1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Cannon.js setup
  world = new CANNON.World();
  world.gravity.set(0, -1.0, 0);

  // Camera position
  camera.position.set(0, 0, DEPTH / 2);
  camera.lookAt(0, 0, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Create walls
  createWalls(frustumSize, aspect);

  // Load custom 3D model
  loadCustomModel();

  // Create wireframe cube
  createWireframeCube();

  // Start animation
  animate();
}

function createWalls(frustumSize, aspect) {
  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Front and back walls
  const frontBackGeometry = new THREE.PlaneGeometry(frustumSize * aspect, frustumSize);
  const frontWall = new THREE.Mesh(frontBackGeometry, wallMaterial);
  frontWall.position.z = DEPTH / 2;
  scene.add(frontWall);

  const backWall = new THREE.Mesh(frontBackGeometry, wallMaterial);
  backWall.position.z = -DEPTH / 2;
  scene.add(backWall);

  // Left and right walls
  const sideGeometry = new THREE.PlaneGeometry(DEPTH, frustumSize);
  const leftWall = new THREE.Mesh(sideGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.x = -frustumSize * aspect / 2;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = frustumSize * aspect / 2;
  scene.add(rightWall);

  // Floor and ceiling
  const floorCeilingGeometry = new THREE.PlaneGeometry(frustumSize * aspect, DEPTH);
  const floor = new THREE.Mesh(floorCeilingGeometry, wallMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -frustumSize / 2;
  scene.add(floor);

  const ceiling = new THREE.Mesh(floorCeilingGeometry, wallMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = frustumSize / 2;
  scene.add(ceiling);

  // Cannon.js bodies for walls
  const wallShape = new CANNON.Plane();
  const wallMaterial_cannon = new CANNON.Material({ restitution: 0.1 });  // Reduce bounciness

  const floorBody = new CANNON.Body({ mass: 0, material: wallMaterial_cannon });
  floorBody.addShape(wallShape);
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  floorBody.position.set(0, -frustumSize / 2, 0);
  world.addBody(floorBody);

  const ceilingBody = new CANNON.Body({ mass: 0, material: wallMaterial_cannon });
  ceilingBody.addShape(wallShape);
  ceilingBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
  ceilingBody.position.set(0, frustumSize / 2, 0);
  world.addBody(ceilingBody);

  const backWallBody = new CANNON.Body({ mass: 0, material: wallMaterial_cannon });
  backWallBody.addShape(wallShape);
  backWallBody.position.set(0, 0, -DEPTH / 2);
  world.addBody(backWallBody);

  const frontWallBody = new CANNON.Body({ mass: 0, material: wallMaterial_cannon });
  frontWallBody.addShape(wallShape);
  frontWallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
  frontWallBody.position.set(0, 0, DEPTH / 2);
  world.addBody(frontWallBody);

  const leftWallBody = new CANNON.Body({ mass: 0, material: wallMaterial_cannon });
  leftWallBody.addShape(wallShape);
  leftWallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
  leftWallBody.position.set(-frustumSize * aspect / 2, 0, 0);
  world.addBody(leftWallBody);

  const rightWallBody = new CANNON.Body({ mass: 0, material: wallMaterial_cannon });
  rightWallBody.addShape(wallShape);
  rightWallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
  rightWallBody.position.set(frustumSize * aspect / 2, 0, 0);
  world.addBody(rightWallBody);
}



function createWireframeCube() {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const edges = new THREE.EdgesGeometry(geometry);
  wireframeCube = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
  wireframeCube.position.set(2, 0, 0);
  scene.add(wireframeCube);

  // Add physics
  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
  wireframeCubeBody = new CANNON.Body({
    mass: 1,
    shape: shape,
    position: new CANNON.Vec3(2, 0, 0),
    material: new CANNON.Material({ restitution: 0.3 })
  });
  world.addBody(wireframeCubeBody);

}


function createCube() {
  const size = Math.random() * 1.5 + 0.5; // Random size between 0.5 and 1
  const geometry = new THREE.BoxGeometry(size, size, size);
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ color: 0x000000 });
  const wireframe = new THREE.LineSegments(edges, material);

  const frustumSize = 10;
  const aspect = window.innerWidth / window.innerHeight;
  const x = Math.random() * frustumSize * aspect - frustumSize * aspect / 2;
  const y = frustumSize / 2 + 1; // Start slightly above the top
  const z = DEPTH / 2;

  wireframe.position.set(x, y, z);
  scene.add(wireframe);

  const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
  const body = new CANNON.Body({
    mass: 1,
    shape: shape,
    position: new CANNON.Vec3(x, y, z),
    material: new CANNON.Material({ restitution: 0.1 })
  });
  world.addBody(body);

  objects.push({ mesh: wireframe, body });
}


function createWireframeTripod() {
  const material = new THREE.LineBasicMaterial({ color: 0x000000 });
  const points = [
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1.732, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, -1.414),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1.732, 0),
    new THREE.Vector3(0, 0, -1.414)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  wireframeTripod = new THREE.LineSegments(geometry, material);
  wireframeTripod.position.set(-2, 0, 0);
  scene.add(wireframeTripod);

  // Add physics (simplified as a sphere)
  const shape = new CANNON.Sphere(1);
  wireframeTripodBody = new CANNON.Body({
    mass: 0.1,
    shape: shape,
    position: new CANNON.Vec3(-2, 0, 0),
    material: new CANNON.Material({ restitution: 0.3 })
  });
  world.addBody(wireframeTripodBody);
}

function loadCustomModel() {
  const loader = new GLTFLoader();
  loader.load(
    'js/threejs/metaMe1.glb',
    (gltf) => {
      customModel = gltf.scene;
      customModel.scale.set(10, 10, 10);

      customModel.traverse((child) => {
        if (child.isMesh) {
          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            wireframeLinewidth: 1
          });
          child.material = wireframeMaterial;
        }
      });

      scene.add(customModel);

      // Create a physical body for the model
      const box = new THREE.Box3().setFromObject(customModel);
      const size = box.getSize(new THREE.Vector3());
      const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
      customModelBody = new CANNON.Body({
        mass: 1,
        shape: shape,
        position: new CANNON.Vec3(0, 5, 0),
        material: new CANNON.Material({ restitution: 0.1 })
      });

      // Apply the same rotation to the physics body
      customModelBody.quaternion.setFromEuler(0, Math.PI / 2, 0);
      world.addBody(customModelBody);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
      console.error('An error happened', error);
    }
  );
}

function createSphere(x, y, z, radius) {
  const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const sphereMaterial = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(x, y, z);
  scene.add(sphere);

  const shape = new CANNON.Sphere(radius);
  const body = new CANNON.Body({
    mass: 1,
    shape: shape,
    position: new CANNON.Vec3(x, y, z),
    material: new CANNON.Material({ restitution: 0.1 })
  });
  world.addBody(body);

  spheres.push({ mesh: sphere, body: body });
}


function resetScene() {
  // Remove all objects
  for (let obj of objects) {
    scene.remove(obj.mesh);
    world.removeBody(obj.body);
  }
  objects = [];

  // Reset spawn timer
  spawnTimer = 0;
}


function animate(time) {
  requestAnimationFrame(animate);
  world.step(1 / 10);

  for (const sphere of spheres) {
    sphere.mesh.position.copy(sphere.body.position);
    sphere.mesh.quaternion.copy(sphere.body.quaternion);
  }

  if (customModel && customModelBody) {
    customModel.position.copy(customModelBody.position);
    customModel.quaternion.copy(customModelBody.quaternion);
  }

  if (wireframeCube && wireframeCubeBody) {
    wireframeCube.position.copy(wireframeCubeBody.position);
    wireframeCube.quaternion.copy(wireframeCubeBody.quaternion);
  }

  if (wireframeTripod && wireframeTripodBody) {
    wireframeTripod.position.copy(wireframeTripodBody.position);
    wireframeTripod.quaternion.copy(wireframeTripodBody.quaternion);
  }

  if (time - spawnTimer > SPAWN_INTERVAL) {
    createCube();
    spawnTimer = time;
  }

  world.step(1 / 10);

  for (let obj of objects) {
    obj.mesh.position.copy(obj.body.position);
    obj.mesh.quaternion.copy(obj.body.quaternion);
  }

  // Check if canvas is filled
  if (objects.length >= MAX_OBJECTS) {
    resetScene();
  }


  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 10;
  DEPTH = frustumSize * aspect;

  camera.left = frustumSize * aspect / -2;
  camera.right = frustumSize * aspect / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;
  camera.near = 0.1;
  camera.far = DEPTH + 1000;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update wall positions
  scene.traverse((object) => {
    if (object.isMesh) {
      if (object.position.z === DEPTH / 2 || object.position.z === -DEPTH / 2) {
        object.position.z = object.position.z > 0 ? DEPTH / 2 : -DEPTH / 2;
      }
      if (object.rotation.y !== 0) {
        object.scale.z = DEPTH;
      }
    }
  });
}

window.addEventListener('resize', onWindowResize);

init();


