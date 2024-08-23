document.addEventListener('DOMContentLoaded', function () {
	const showcaseImages = document.querySelectorAll('.showcase-image');
	const menuButton = document.querySelector('.menu-button');
	const menuOverlay = document.querySelector('.menu-overlay');
	const menuContent = document.querySelector('.menu-content');
	const menuItems = document.querySelectorAll('.menu-item');
	const homeLink = document.getElementById('home-link');
	let currentIndex = 0;
	let slideInterval;

	function showNextImage() {
		showcaseImages[currentIndex].classList.remove('active');
		currentIndex = (currentIndex + 1) % showcaseImages.length;
		showcaseImages[currentIndex].classList.add('active');
	}

	function startSlideshow() {
		stopSlideshow();
		slideInterval = setInterval(showNextImage, 5000);
	}

	function stopSlideshow() {
		if (slideInterval) {
			clearInterval(slideInterval);
		}
	}

	function toggleMenu() {
		menuOverlay.classList.toggle('active');
		if (menuOverlay.classList.contains('active')) {
			stopSlideshow();
		} else if (showcaseImages.length > 0) {
			startSlideshow();
		}
	}

	if (showcaseImages.length > 0) {
		startSlideshow();
	}

	if (menuButton) {
		menuButton.addEventListener('click', toggleMenu);
	}

	if (homeLink) {
		homeLink.addEventListener('click', function (event) {
			event.preventDefault();
			const currentPage = window.location.pathname.split('/').pop();
			if (currentPage !== 'index.html') {
				window.location.href = 'index.html';
			}
		});
	}

	menuItems.forEach((item) => {
		item.addEventListener('click', function (event) {
			event.stopPropagation(); // Prevent the click from bubbling up to the overlay
			const pageName = this.textContent.trim().toLowerCase();
			if (pageName === 'works' || pageName === 'top') {
				const currentPage = window.location.pathname.split('/').pop();
				const targetPage = pageName === 'top' ? 'index.html' : 'works.html';

				if (currentPage !== targetPage) {
					window.location.href = targetPage;
				} else {
					toggleMenu();
				}
			} else {
				toggleMenu();
			}
		});
	});

	// Close menu when clicking on the overlay (but not on menu items)
	if (menuOverlay) {
		menuOverlay.addEventListener('click', function (event) {
			if (event.target === menuOverlay) {
				toggleMenu();
			}
		});
	}

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape' && menuOverlay.classList.contains('active')) {
			toggleMenu();
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