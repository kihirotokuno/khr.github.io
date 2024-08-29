import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, originalModel, pointCloud, controls;
let originalTexture;

let currentCameraIndex = 0;
let isPointCloud = false;


const cameraPositions = [
  new THREE.Vector3(0, 20, 0),
  new THREE.Vector3(0, 0, 10),
  new THREE.Vector3(7, 7, 7),
  new THREE.Vector3(-7, 7, 7),
  new THREE.Vector3(4, -4, 4)
];

const ASPECT_RATIO = 16 / 14;


function init() {
  const container = document.getElementById('3dAvatar');
  if (!container) {
    console.error('3dAvatar container not found');
    return;
  }



  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);  // Keep white background

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  updateRendererSize();
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  updateCamera();

  controls = new OrbitControls(camera, renderer.domElement);

  const loader = new GLTFLoader();
  loader.load(
    'js/threejs/metaMe1.glb',
    function (gltf) {
      originalModel = gltf.scene;
      setupModel(originalModel);
      createPointCloud(originalModel);

      // Start model/point cloud switching
      setInterval(toggleModelType, 1000); // Switch every 5 seconds

      // Start camera switching
      setInterval(switchCameraPosition, 2000); // Switch every 3 seconds

      // Start animation loop
      animate();
    },
    undefined,
    function (error) {
      console.error('An error happened', error);
    }
  );
}

function setupModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 15 / maxDim;
  model.scale.setScalar(scale);

  model.position.sub(center.multiplyScalar(scale));
  model.position.y -= 3;  // Lower the position

  scene.add(model);
}

function createPointCloud(model) {
  let geometry = new THREE.BufferGeometry();
  let positions = [];

  model.traverse((child) => {
    if (child.isMesh) {
      const geom = child.geometry;
      const pos = geom.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
    }
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x000000,  // Black points
    size: 1.0,
    sizeAttenuation: true
  });

  pointCloud = new THREE.Points(geometry, material);

  // Apply the same transformation as the original model
  pointCloud.scale.copy(originalModel.scale);
  pointCloud.position.copy(originalModel.position);
  pointCloud.rotation.copy(originalModel.rotation);

  scene.add(pointCloud);
  pointCloud.visible = false;  // Initially hide the point cloud
}

function toggleModelType() {
  isPointCloud = !isPointCloud;
  originalModel.visible = !isPointCloud;
  pointCloud.visible = isPointCloud;
}

function updateRendererSize() {
  const width = window.innerWidth;
  const height = width / ASPECT_RATIO;
  renderer.setSize(width, height);
}

function updateCamera() {
  const width = window.innerWidth;
  const height = width / ASPECT_RATIO;
  const aspect = width / height;
  const frustumSize = 15;

  camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
  );
  updateCameraPosition();
}

function updateCameraPosition() {
  camera.position.copy(cameraPositions[currentCameraIndex]);
  camera.lookAt(scene.position);
  camera.updateProjectionMatrix();
}

function switchCameraPosition() {
  currentCameraIndex = (currentCameraIndex + 1) % cameraPositions.length;
  updateCameraPosition();
}

function animate() {
  requestAnimationFrame(animate);

  if (originalModel) {
    originalModel.rotation.y += 0.01;
    originalModel.rotation.z += 0.001;
  }
  if (pointCloud) {
    pointCloud.rotation.y += 0.02;
    originalModel.rotation.z += 0.01;
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  updateRendererSize();
  updateCamera();
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', onWindowResize, false);