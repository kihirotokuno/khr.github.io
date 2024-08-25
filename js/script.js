document.addEventListener('DOMContentLoaded', function () {
	const showcaseImages = document.querySelectorAll('.showcase-image');
	const topHeader = document.querySelector('.top-header');
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

	if (showcaseImages.length > 0) {
		startSlideshow();
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