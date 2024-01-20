import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const width = window.innerWidth, height = window.innerHeight;

// init

const camera = new THREE.PerspectiveCamera(17, width / height, 0.01, 1000 );
//camera.position.z = 1;
camera.position.set(0, 0, 3);

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xDAFF00 );


// generate cube
// const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
// const material = new THREE.MeshPhysicalMaterial({
//     roughness: 0.0,
//     transmission: 1,
//     thickness: 1
// });
// const mesh = new THREE.Mesh( geometry, material );
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


const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( width, height );
//renderer.setAnimationLoop( animation );
document.body.appendChild( renderer.domElement );

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333); // soft white light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 10.0);
scene.add(directionalLight);


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

function animate() {
    requestAnimationFrame( animate );

    // mesh_hex.rotation.x += 0.01;
    // mesh_hex.rotation.y += 0.01;

    renderer.render( scene, camera );
}
animate();

