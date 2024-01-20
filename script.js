document.addEventListener("DOMContentLoaded", () => {
    // Ensure WebGL support
    if (!WEBGL.isWebGLAvailable()) {
        alert('WebGL is not supported in your browser. Please use a WebGL-compatible browser.');
        return;
    }

    // Scene, camera, and renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5); // Adjust camera position
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    camera.add(pointLight);
    scene.add(camera);

    // Load 3D model
    const loader = new THREE.GLTFLoader();
    loader.load('Assets/3dmodel/pc.glb', (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            model.rotation.y += 0.01; // Rotate the model for visibility
            renderer.render(scene, camera);
        };
        animate();
    }, undefined, (error) => {
        console.error('An error happened while loading the model:', error);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
