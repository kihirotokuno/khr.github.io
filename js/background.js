import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';

let scene, camera, renderer, world, controls;
let spheres = [];
let customModel, customModelBody;
let wireframeCube, wireframeCubeBody;
let wireframeTripod, wireframeTripodBody;
let objects = [];

let DEPTH = 5;
const SPAWN_INTERVAL = 3000;
let spawnTimer = 0;
const MAX_OBJECTS = 15;

let interactionState = 'floating'; // 'gravity', 'floating', 'falling'
let mousePosition = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

let walls = {
  front: null,
  back: null,
  left: null,
  right: null,
  floor: null,
  ceiling: null
};


const MAX_ANGULAR_VELOCITY = 2; // 最大角速度（ラジアン/秒）
const FLOATING_ANGULAR_DAMPING = 0.9; // 浮遊状態での角度ダンピング
const NORMAL_ANGULAR_DAMPING = 0.4; // 通常状態での角度ダンピング

function init() {
  // Three.js setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 10;

  camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2, frustumSize * aspect / 2,
    frustumSize / 2, frustumSize / -2,
    0.1, DEPTH + 3000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.zIndex = '-2';
  const canvas = document.getElementById('background-canvas');
  canvas.replaceWith(renderer.domElement);

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

  // // Create wireframe cube
  // createWireframeCube();

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('scroll', onScroll);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

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

  frontWall.name = 'wall-front';
  backWall.name = 'wall-back';
  leftWall.name = 'wall-left';
  rightWall.name = 'wall-right';
  floor.name = 'wall-floor';
  ceiling.name = 'wall-ceiling';

  // Cannon.js bodies for walls
  const wallShape = new CANNON.Plane();
  const wallMaterial_cannon = new CANNON.Material({ restitution: 0.01, friction: 0.5, });


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
  wireframeCube = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x272727 }));
  wireframeCube.position.set(2, 0, 0);
  scene.add(wireframeCube);

  // Add physics
  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
  wireframeCubeBody = new CANNON.Body({
    mass: 1,
    shape: shape,
    position: new CANNON.Vec3(2, 0, 0),
    material: new CANNON.Material({ restitution: 0.01, friction: 0.5 }),
    angularDamping: NORMAL_ANGULAR_DAMPING
  });
  world.addBody(wireframeCubeBody);

}


function createCube() {
  const size = Math.random() * 1.5 + 0.5; // Random size between 0.5 and 1
  const geometry = new THREE.BoxGeometry(size, size, size);
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ color: 0x272727 });
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
    material: new CANNON.Material({ restitution: 0.01, friction: 0.5 }),
    angularDamping: NORMAL_ANGULAR_DAMPING
  });

  world.addBody(body);

  objects.push({ mesh: wireframe, body });

  if (objects.length > MAX_OBJECTS) {
    removeOldestCube();
  }
}

function removeOldestCube() {
  const oldestObject = objects.shift(); // Remove the first (oldest) object
  scene.remove(oldestObject.mesh); // Remove from Three.js scene
  world.removeBody(oldestObject.body); // Remove from Cannon.js world
}

function loadCustomModel() {
  const loader = new GLTFLoader();
  loader.load(
    'model/metaMe1.glb',
    (gltf) => {
      customModel = gltf.scene;

      // モデルのスケールを一度だけ設定
      const isMobile = window.innerWidth <= 768;
      const scale = isMobile ? 5 : 10;
      customModel.scale.set(scale, scale, scale);

      customModel.traverse((child) => {
        if (child.isMesh) {
          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x272727,
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
        material: new CANNON.Material({ restitution: 0.01 }),
        angularDamping: NORMAL_ANGULAR_DAMPING
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


function onMouseMove(event) {
  mousePosition.x = -((event.clientX / window.innerWidth) * 2 - 1);
  mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseDown() {
  switch (interactionState) {
    case 'gravity':
      interactionState = 'floating';
      world.gravity.set(0, 0, 0);
      break;
    case 'floating':
      interactionState = 'falling';
      world.gravity.set(0, -9.81, 0);
      break;
    case 'falling':
      // Do nothing on mouse down when falling
      break;
  }
}

function onMouseUp() {
  if (interactionState === 'falling') {
    interactionState = 'gravity';
  }
}

function animate(time) {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  raycaster.setFromCamera(mousePosition, camera);

  updateObjects();

  if (time - spawnTimer > SPAWN_INTERVAL) {
    createCube();
    spawnTimer = time;
  }

  // // Check if canvas is filled
  // if (objects.length >= MAX_OBJECTS) {
  //   resetScene();
  // }

  renderer.render(scene, camera);
}

function updateObjects() {
  const updateObject = (obj, body) => {
    obj.position.copy(body.position);
    obj.quaternion.copy(body.quaternion);

    // 角速度の制限
    const angularVelocity = body.angularVelocity;
    const angularSpeed = angularVelocity.length();
    if (angularSpeed > MAX_ANGULAR_VELOCITY) {
      angularVelocity.scale(MAX_ANGULAR_VELOCITY / angularSpeed, angularVelocity);
      body.angularVelocity.copy(angularVelocity);
    }

    // 状態に応じたダンピングの調整
    body.angularDamping = interactionState === 'floating' ? FLOATING_ANGULAR_DAMPING : NORMAL_ANGULAR_DAMPING;

    if (interactionState === 'floating' || interactionState === 'falling') {
      applyMouseAttraction(body);
    }
  };

  // 既存のコードはそのまま
  for (const sphere of spheres) {
    updateObject(sphere.mesh, sphere.body);
  }

  if (customModel && customModelBody) {
    updateObject(customModel, customModelBody);
  }

  if (wireframeCube && wireframeCubeBody) {
    updateObject(wireframeCube, wireframeCubeBody);
  }

  if (wireframeTripod && wireframeTripodBody) {
    updateObject(wireframeTripod, wireframeTripodBody);
  }

  for (let obj of objects) {
    updateObject(obj.mesh, obj.body);
  }
}

// applyMouseAttraction 関数を以下のように修正
function applyMouseAttraction(body) {
  const force = new CANNON.Vec3(
    mousePosition.x * 10 - body.position.x,
    mousePosition.y * 10 - body.position.y,
    -body.position.z
  );
  const strength = interactionState === 'floating' ? 0.5 : 0.1;
  force.scale(strength, force);
  body.applyForce(force, body.position);

  // 浮遊状態での回転力の適用を制限
  if (interactionState === 'floating') {
    body.torque.set(0, 0, 0); // 回転力をゼロにする
  }
}

function onScroll() {
  const scrollY = window.scrollY;
  scene.position.y = scrollY * 0.01;
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

  // Update wall positions and other objects
  scene.traverse((object) => {
    if (object.isMesh) {
      // カスタムモデルや他のオブジェクトの処理
      if (object.position.z === DEPTH / 2 || object.position.z === -DEPTH / 2) {
        object.position.z = object.position.z > 0 ? DEPTH / 2 : -DEPTH / 2;
      }
      if (object.rotation.y !== 0) {
        // object.scale.z = DEPTH;
      }

      // 壁の処理
      if (object.name && object.name.startsWith('wall-')) {
        const wallWidth = frustumSize * aspect;
        switch (object.name) {
          case 'wall-front':
          case 'wall-back':
            object.scale.x = wallWidth / 10;
            object.position.z = object.name === 'wall-front' ? DEPTH / 2 : -DEPTH / 2;
            break;
          case 'wall-left':
            object.position.x = -wallWidth / 2;
            break;
          case 'wall-right':
            object.position.x = wallWidth / 2;
            break;
          case 'wall-floor':
          case 'wall-ceiling':
            object.scale.x = wallWidth / 10;
            break;
        }
      }
    }
  });

  // Update Cannon.js wall bodies
  updateWallBodies(frustumSize, aspect);
}


function updateWallBodies(frustumSize, aspect) {
  const wallWidth = frustumSize * aspect;

  world.bodies.forEach(body => {
    if (body.shapes[0] instanceof CANNON.Plane) {
      if (body.position.x < 0) {  // 左の壁
        body.position.x = -wallWidth / 2;
      } else if (body.position.x > 0) {  // 右の壁
        body.position.x = wallWidth / 2;
      }
      // 前後の壁、床、天井の位置は変更不要
    }
  });
}

window.addEventListener('resize', onWindowResize);
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  scene.position.y = scrollY * 0.01;
});

init();


function placeRandomWords() {
  const header = document.querySelector('.header');
  const words = [
    { text: "TOKUNO", element: document.querySelector('.tokuno') },
    { text: "KIHIRO", element: document.querySelector('.kihiro') },
    { text: "トクノ", element: document.querySelector('.div') },
    { text: "キヒロ", element: document.querySelector('.div1') },
    { text: "徳野", element: document.querySelector('.div:nth-child(5)') },
    { text: "稀太", element: document.querySelector('.div:nth-child(6)') }
  ];

  const headerHeight = header.clientHeight;
  const leftMargin = 20; // Pixels from the left for left alignment
  const topMargin = 20;  // Pixels of margin between the words
  const rotations = [0, 15, -15, 30, -30]; // Rotation angles
  const placedPositions = []; // To keep track of placed word positions

  function getRandomVerticalPosition(height) {
    return Math.random() * (headerHeight - height);
  }

  function isOverlapping(newTop, newHeight) {
    return placedPositions.some(pos => {
      // Adjust for top margin to add spacing between words
      return !(newTop + newHeight + topMargin < pos.top || newTop > pos.top + pos.height + topMargin);
    });
  }

  function placeWord(wordObj) {
    const wordElement = wordObj.element;

    // Check if the word element exists before proceeding
    if (!wordElement) {
      console.warn(`Element for ${wordObj.text} not found.`);
      return; // Skip to the next word if element doesn't exist
    }

    const wordHeight = wordElement.offsetHeight;

    let y, attempts = 0, maxAttempts = 100; // Max attempts to avoid infinite loops
    do {
      y = getRandomVerticalPosition(wordHeight);
      attempts++;
    } while (isOverlapping(y, wordHeight) && attempts < maxAttempts);

    // If too many attempts are made, just place it anywhere (last resort)
    if (attempts >= maxAttempts) {
      console.warn('Too many attempts to avoid overlap, placing anyway.');
    }

    // Apply random rotation from predefined set
    const rotation = rotations[Math.floor(Math.random() * rotations.length)];

    // Apply styles for left alignment, random vertical position, and rotation
    wordElement.style.position = 'absolute';
    wordElement.style.left = `${leftMargin}px`;  // Left aligned
    wordElement.style.top = `${y}px`;
    wordElement.style.transform = `rotate(${rotation}deg)`;

    // Store the placed position to check for future overlap
    placedPositions.push({ top: y, height: wordHeight });
  }

  // Place all the words using the procedural algorithm with collision detection
  words.forEach(word => placeWord(word));
}

// Call the function when the window loads
window.onload = placeRandomWords;