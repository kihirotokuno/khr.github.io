document.addEventListener('DOMContentLoaded', function () {
	const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
	const content = document.querySelector('.iphonemini');

	//////Main page///////
	const showcaseImages = document.querySelectorAll('.showcase-image');
	const progressBar = document.querySelector('.slideshow-progress-bar');
	let currentIndex = 0;
	let slideshowTimer;
	const slideDuration = 2000; // 5 seconds

	//////Menu UI///////
	const topHeader = document.querySelector('.top-header');
	const menuButton = document.querySelector('.menu-button');
	const menuOverlay = document.querySelector('.menu-overlay');
	const menuContent = document.querySelector('.menu-content');
	const menuItems = document.querySelectorAll('.menu-item');
	const homeLink = document.getElementById('home-link');

	// Preload images
	function preloadImages() {
		showcaseImages.forEach(img => {
			const src = img.getAttribute('src');
			if (src) {
				const newImg = new Image();
				newImg.src = src;
			}
		});
	}

	//////loading page///////

	if (isIndexPage) {
		const loadingScreen = document.getElementById('loading-screen');
		const canvas = document.getElementById('loading-canvas');
		const ctx = canvas.getContext('2d');

		// Set canvas size
		function setCanvasSize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
		setCanvasSize();

		// Circle properties
		const circles = [];
		const maxCircles = 100;
		const initialCircles = 50;
		const initialCircleSize = 20;
		const maxCircleSize = 230;
		let circleCount = 0;
		let startTime = Date.now();

		// Create a circle
		function createCircle() {
			return {
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height - canvas.height,
				initialRadius: Math.random() * initialCircleSize + 10,
				speed: Math.random() * 10 + 5
			};
		}

		// Initialize circles
		for (let i = 0; i < initialCircles; i++) {
			circles.push(createCircle());
			circleCount++;
		}

		// Animation function
		function animate() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = 'black';

			const currentTime = Date.now();
			const elapsedTime = (currentTime - startTime) / 1000; // time in seconds

			// Add new circles over time
			if (circleCount < maxCircles && Math.random() < 0.1) {
				circles.push(createCircle());
				circleCount++;
			}

			circles.forEach(circle => {
				// Calculate current radius based on elapsed time
				const growthFactor = Math.min(elapsedTime / 3, 1); // Max growth after 10 seconds
				const currentRadius = circle.initialRadius + (maxCircleSize - circle.initialRadius) * growthFactor;

				ctx.beginPath();
				ctx.arc(circle.x, circle.y, currentRadius, 0, Math.PI * 2);
				ctx.fill();

				circle.y += circle.speed;

				if (circle.y > canvas.height + currentRadius) {
					circle.y = -currentRadius;
					circle.x = Math.random() * canvas.width;
				}
			});

			requestAnimationFrame(animate);
		}

		// Start animation
		animate();

		// Function to hide loading screen and show content
		function hideLoadingScreen() {
			loadingScreen.style.opacity = '0';
			loadingScreen.style.visibility = 'hidden';
			content.style.visibility = 'visible';
			content.style.opacity = '1';
		}

		// Preload images
		function preloadImages() {
			const images = document.querySelectorAll('img');
			return Promise.all(Array.from(images).map(img => {
				if (img.complete) return Promise.resolve();
				return new Promise((resolve, reject) => {
					img.onload = resolve;
					img.onerror = reject;
				});
			}));
		}



		// Hide content initially
		content.style.visibility = 'hidden';
		content.style.opacity = '0';
		content.style.transition = 'opacity 0.5s ease-in';

		// Hide loading screen when images are loaded and a minimum time has passed
		const minimumLoadTime = 3000; // 3 seconds minimum loading time
		const loadStartTime = Date.now();

		Promise.all([
			preloadImages(),
			new Promise(resolve => setTimeout(resolve, minimumLoadTime))
		]).then(() => {
			const loadEndTime = Date.now();
			const loadDuration = loadEndTime - loadStartTime;
			if (loadDuration < minimumLoadTime) {
				setTimeout(hideLoadingScreen, minimumLoadTime - loadDuration);
			} else {
				hideLoadingScreen();
			}
		}).catch(error => {
			console.error('Error loading images:', error);
			hideLoadingScreen(); // Hide loading screen even if there's an error
		});

		// Handle window resize
		window.addEventListener('resize', setCanvasSize);

		function requestOrientationPermission() {
			if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
				DeviceOrientationEvent.requestPermission()
					.then(permissionState => {
						if (permissionState === 'granted') {
							window.addEventListener('deviceorientation', handleOrientation);
						}
					})
					.catch(console.error);
			} else {
				// Handle regular non iOS 13+ devices
				window.addEventListener('deviceorientation', handleOrientation);
			}
		}

		// Add a button to request permissions
		const permissionButton = document.createElement('button');
		permissionButton.textContent = 'Enable Gyroscope';
		permissionButton.style.position = 'fixed';
		permissionButton.style.bottom = '20px';
		permissionButton.style.left = '50%';
		permissionButton.style.transform = 'translateX(-50%)';
		permissionButton.style.zIndex = '1000';
		permissionButton.addEventListener('click', requestOrientationPermission);
		document.body.appendChild(permissionButton);



	} else {
		// For pages other than index, make content visible immediately
		content.style.visibility = 'visible';
		content.style.opacity = '1';
	}



	//////Main page///////

	function showNextImage() {
		showcaseImages[currentIndex].classList.remove('active');
		currentIndex = (currentIndex + 1) % showcaseImages.length;
		showcaseImages[currentIndex].classList.add('active');
	}

	function updateProgressBar(progress) {
		progressBar.style.width = `${progress * 100}%`;
	}

	function runSlideshow() {
		let startTime = null;
		let animationFrameId = null;

		function step(timestamp) {
			if (!startTime) startTime = timestamp;
			const elapsed = timestamp - startTime;
			const progress = Math.min(elapsed / slideDuration, 1);

			updateProgressBar(progress);

			if (progress < 1) {
				animationFrameId = requestAnimationFrame(step);
			} else {
				showNextImage();
				startTime = null;
				animationFrameId = requestAnimationFrame(step);
			}
		}

		return {
			start: function () {
				if (!animationFrameId) {
					animationFrameId = requestAnimationFrame(step);
				}
			},
			stop: function () {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
			},
			reset: function () {
				startTime = null;
				updateProgressBar(0);
			}
		};
	}

	function startSlideshow() {
		if (slideshowTimer) {
			slideshowTimer.stop();
		}
		slideshowTimer = runSlideshow();
		slideshowTimer.start();
	}

	function stopSlideshow() {
		if (slideshowTimer) {
			slideshowTimer.stop();
		}
	}

	if (showcaseImages.length > 0) {
		preloadImages();
		startSlideshow();
	}

	////////////////////////


	function toggleMenu(event) {
		if (event.target.tagName.toLowerCase() === 'a') {
			event.preventDefault();
		}

		menuOverlay.classList.toggle('active');
		topHeader.classList.toggle('menu-active');
		const isActive = menuOverlay.classList.contains('active');

		if (isActive) {
			menuButton.textContent = 'CLOSE';
			stopSlideshow();
		} else {
			menuButton.textContent = 'MENU';
			if (showcaseImages.length > 0) {
				startSlideshow();
			}
		}

		if (window.p5Instance && window.p5Instance.setMenuActive) {
			window.p5Instance.setMenuActive(isActive);
		}

		document.getElementById('p5-canvas').classList.toggle('menu-active', isActive);
	}

	topHeader.addEventListener('click', toggleMenu);

	if (homeLink) {
		homeLink.addEventListener('click', function (event) {
			event.stopPropagation();
			const currentPage = window.location.pathname.split('/').pop();
			if (currentPage !== 'index.html') {
				window.location.href = 'index.html';
			}
		});

		homeLink.addEventListener('mouseenter', function () {
			topHeader.classList.add('home-hover');
		});
	}

	menuItems.forEach((item) => {
		item.addEventListener('click', function (event) {
			event.stopPropagation();
			const pageName = this.textContent.trim().toLowerCase();
			if (pageName === 'works' || pageName === 'top') {
				const currentPage = window.location.pathname.split('/').pop();
				const targetPage = pageName === 'top' ? 'index.html' : 'works.html';

				if (currentPage !== targetPage) {
					window.location.href = targetPage;
				} else {
					toggleMenu(event);
				}
			} else {
				toggleMenu(event);
			}
		});
	});

	if (menuOverlay) {
		menuOverlay.addEventListener('click', function (event) {
			if (event.target === menuOverlay) {
				toggleMenu(event);
			}
		});
	}

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape' && menuOverlay.classList.contains('active')) {
			toggleMenu(event);
		}
	});



	document.addEventListener('visibilitychange', function () {
		if (document.hidden) {
			stopSlideshow();
		} else if (showcaseImages.length > 0) {
			startSlideshow();
		}
	});
});

function handleOrientation(event) {
	// This function is now defined in the p5 sketch
	// We keep it here for compatibility with the permission request
}