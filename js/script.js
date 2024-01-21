import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {PLYLoader} from 'three/addons/loaders/PLYLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls';

const width = window.innerWidth, height = window.innerHeight;

// init

// Camera
const camera = new THREE.PerspectiveCamera(17, width / height, 0.01, 1000 );
//camera.position.z = 1;
camera.position.set(0, 0, 1);

// Background
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xFFFFFF );


//generate cube
//const geometry = new THREE.SphereGeometry( 1.0, 1.0, 1.0 );
const material_pc = new THREE.PointsMaterial({
    vertexColors: true,//頂点の色付けを有効にする
    size: 0.2
});
// const material_cube = new THREE.MeshPhysicalMaterial({
//     roughness: 0.0,
//     transmission: 1,
//     thickness: 1
// });
// const mesh = new THREE.Mesh( geometry, material_cube);
// scene.add( mesh );


// // generate hex
// const geometry_hex = new THREE.IcosahedronGeometry(0.1, 0);
// const material_hex = new THREE.MeshPhysicalMaterial({
//     roughness: 0,
//     transmission: 1,
//     thickness: 0.1 // Add refraction!
// });
// const mesh_hex = new THREE.Mesh(geometry_hex, material_hex)
// mesh_hex.position.set = (2, 0, 0);
// scene.add(mesh_hex);


//add bg pics for reflection
// const bgTexture = new THREE.TextureLoader().load("assets/spark.jpg");
// const bgGeometry = new THREE.PlaneGeometry(2, 1);
// const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
// const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
// bgMesh.position.set(0, 0, -3);
// bgMesh.rotation.set(0, 180, 0);
// scene.add(bgMesh);


var renderer = new THREE.WebGLRenderer({

    alpha: true,
    antialias: true

});
renderer.setClearColor(0x010101, 0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.setAnimationLoop( animation );
document.body.appendChild( renderer.domElement );

// Camera Control
const controls = new OrbitControls(camera, renderer.domElement);


window.addEventListener('resize', function () {

    var width = window.innerWidth;
    var height = window.innerHeight;

    renderer.setSize(width, height);

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

});


// Lighting
const ambientLight = new THREE.AmbientLight(0x333333); // soft white light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
scene.add(directionalLight);
// Rect Lighting
const rectWidth = 0.2;
const rectHeight = 0.5;

//RectAreaLightUniformsLib.Init();
const rectLight = new THREE.RectAreaLight(0xffffff, 0.5, width, height);
rectLight.position.set(5, 5, 5);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);

// Hem Light
const upperColor = 0xFFFF40;
const downColor = 0x4040FF;
const hemLight = new THREE.HemisphereLight(upperColor, downColor, 1.0);
scene.add(hemLight);





// Instantiate a loader
const loader = new GLTFLoader();

// Load a glTF resource
loader.load(
	// resource URL
	'./assets/3dmodel/pc.gltf',

	// called when the resource is loaded
	function ( gltf ) {

		scene.add( gltf.scene );

		gltf.animations; // Array<THREE.AnimationClip>
		gltf.scene; // THREE.Group
		gltf.scenes; // Array<THREE.Group>
		gltf.cameras; // Array<THREE.Camera>
		gltf.asset; // Object

	},
	// called while loading is progressing
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

    },
);

loader.load(
	// resource URL
	'./assets/3dmodel/icon_3d.gltf',

	// called when the resource is loaded
	function ( gltf ) {

		scene.add( gltf.scene );
        gltf.position.set(0, 0, 1);
		gltf.animations; // Array<THREE.AnimationClip>
		gltf.scene; // THREE.Group
		gltf.scenes; // Array<THREE.Group>
		gltf.cameras; // Array<THREE.Camera>
		gltf.asset; // Object

	},
	// called while loading is progressing
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

    },
);


const plyLoader = new PLYLoader();
const material = new THREE.PointsMaterial({
    vertexColors: true,//頂点の色付けを有効にする
    size: 0.04,
});

plyLoader.load('./assets/3dmodel/idd_lab.ply', (geometry) => { //引数にはpositionとcolorを持つBufferGeometryが入ってる
    const particles = new THREE.Points(geometry, material_pc);
    particles.rotation.set(0, 90, 90);
    particles.size.set(0.1, 0.1, 0.1);
    scene.add(particles);
});





function animate() {
    requestAnimationFrame( animate );

    // mesh_hex.rotation.x += 0.01;
    // mesh_hex.rotation.y += 0.01;

    renderer.render( scene, camera );
}
animate();

