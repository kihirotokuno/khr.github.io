// three.js

let scene, camera, renderer, model;
let currentCameraIndex = 0;
const cameraPositions = [
  new THREE.Vector3(0, 20, 0),    // Top view, far
  new THREE.Vector3(0, 0, 10),    // Straight-on front view, normal distance
  new THREE.Vector3(7, 7, 7),     // Diagonal from above, normal distance
  new THREE.Vector3(-7, 7, 7),    // Diagonal from above, other side, normal distance
  new THREE.Vector3(4, -4, 4)     // Diagonal from below, close
];

function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);  // White background

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.gammaFactor = 2.2;
  document.getElementById('3dAvatar').appendChild(renderer.domElement);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Load 3D model
  const loader = new THREE.GLTFLoader();
  loader.load(
    'js/threejs/metaMe.glb',
    function (gltf) {
      model = gltf.scene;
      scene.add(model);

      // Compute the bounding box of the model
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Calculate the largest dimension of the model
      const maxDim = Math.max(size.x, size.y, size.z);

      // Scale the model to fit within a 10 unit cube
      const scale = 10 / maxDim;
      model.scale.setScalar(scale);

      // Center the model
      model.position.sub(center.multiplyScalar(scale));

      // Create orthographic camera after model is loaded
      const aspect = window.innerWidth / window.innerHeight;
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

      // Traverse the model to ensure materials are set up correctly
      model.traverse((child) => {
        if (child.isMesh) {
          if (child.material.map) child.material.map.encoding = THREE.sRGBEncoding;
          child.material.needsUpdate = true;
        }
      });

      // Start camera position switching
      setInterval(switchCameraPosition, 1000);
    },
    undefined,
    function (error) {
      console.error('An error happened', error);
    }
  );

  // Start animation loop
  animate();
}

function updateCameraPosition() {
  camera.position.copy(cameraPositions[currentCameraIndex]);
  camera.lookAt(scene.position);

  // Adjust the frustum size based on the camera distance
  const distance = camera.position.length();
  let frustumSize = 15;  // Default size

  if (distance > 15) {
    frustumSize = distance * 1.2;  // Increase frustum size for far views
  } else if (distance < 7) {
    frustumSize = 10;  // Decrease frustum size for close views
  }

  const aspect = window.innerWidth / window.innerHeight;
  camera.left = frustumSize * aspect / -2;
  camera.right = frustumSize * aspect / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;
  camera.updateProjectionMatrix();
}

function switchCameraPosition() {
  currentCameraIndex = (currentCameraIndex + 1) % cameraPositions.length;
  updateCameraPosition();
}

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    model.rotation.y += 0.005;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function onWindowResize() {
  if (camera && renderer) {
    updateCameraPosition();  // This will handle frustum size adjustment
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Event listeners
window.addEventListener('resize', onWindowResize, false);

// Initialize the 3D scene
init();