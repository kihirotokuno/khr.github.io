document.addEventListener("DOMContentLoaded", () => {
    // Scene, camera, and renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    camera.add(pointLight);
    scene.add(camera);

    // Load 3D model (placeholder model URL)
    const loader = new THREE.GLTFLoader();
    loader.load('Assets/3dmodel/pc.glb', (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(0.5, 0.5, 0.5); // Adjust scale based on model size
        scene.add(model);

        // Click event
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        function onClick(event) {
            event.preventDefault();
            mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
            mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                console.log('Model clicked');
                // Add any specific actions you want to trigger when the model is clicked
            }
        }
        window.addEventListener('click', onClick, false);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            // Add any animations or interactions here
            renderer.render(scene, camera);
        };
        animate();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
