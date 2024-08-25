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
		const hasLoaded = sessionStorage.getItem('hasLoaded');

		function hideLoadingScreen() {
			loadingScreen.style.opacity = '0';
			loadingScreen.style.visibility = 'hidden';
			content.style.visibility = 'visible';
			content.style.opacity = '1';
			sessionStorage.setItem('hasLoaded', 'true');
			showAccelerometerMessage();
		}

		function showAccelerometerMessage() {
			const messageElement = document.createElement('div');
			messageElement.textContent = 'Tilt your device to interact with the menu!';
			messageElement.style.position = 'fixed';
			messageElement.style.bottom = '20px';
			messageElement.style.left = '50%';
			messageElement.style.transform = 'translateX(-50%)';
			messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
			messageElement.style.color = 'white';
			messageElement.style.padding = '10px';
			messageElement.style.borderRadius = '5px';
			messageElement.style.zIndex = '1000';
			document.body.appendChild(messageElement);

			setTimeout(() => {
				messageElement.style.opacity = '0';
				messageElement.style.transition = 'opacity 0.5s ease-out';
				setTimeout(() => messageElement.remove(), 500);
			}, 3000);
		}

		if (!hasLoaded) {
			// Preload images and handle loading screen
			// ... (your existing preload and loading screen code) ...

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
		} else {
			// If already loaded once, hide loading screen immediately
			loadingScreen.style.display = 'none';
			content.style.visibility = 'visible';
			content.style.opacity = '1';
		}

		// Request device orientation permissions
		if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
			DeviceOrientationEvent.requestPermission()
				.then(permissionState => {
					if (permissionState === 'granted') {
						window.addEventListener('deviceorientation', handleOrientation);
					}
				})
				.catch(console.error);
		} else {
			window.addEventListener('deviceorientation', handleOrientation);
		}
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
	if (window.p5Instance && window.p5Instance.setGyroData) {
		window.p5Instance.setGyroData(event.gamma, event.beta);
	}

	// Update gyro display
	const gyroDisplay = document.getElementById('gyro-display');
	if (gyroDisplay) {
		gyroDisplay.textContent = `Gyro X: ${event.gamma.toFixed(2)}\nGyro Y: ${event.beta.toFixed(2)}`;
	}
}