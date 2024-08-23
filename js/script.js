document.addEventListener('DOMContentLoaded', function () {
	const images = document.querySelectorAll('.rectangle');
	const menuButton = document.querySelector('.menu-button');
	const menuOverlay = document.querySelector('.menu-overlay');
	const menuItems = document.querySelectorAll('.menu-item');
	let currentIndex = 0;
	let slideInterval;

	function showNextImage() {
		images[currentIndex].classList.remove('active');
		currentIndex = (currentIndex + 1) % images.length;
		images[currentIndex].classList.add('active');
	}

	function startSlideshow() {
		slideInterval = setInterval(showNextImage, 5000); // Change image every 5 seconds
	}

	function stopSlideshow() {
		clearInterval(slideInterval);
	}

	function toggleMenu() {
		menuOverlay.classList.toggle('active');
		if (menuOverlay.classList.contains('active')) {
			// Hide images and stop slideshow when menu is shown
			images.forEach(img => img.style.opacity = '0');
			stopSlideshow();
		} else {
			// Show images and restart slideshow when menu is closed
			images[currentIndex].style.opacity = '1';
			startSlideshow();
		}
	}

	// Start the slideshow initially
	startSlideshow();

	// Menu functionality
	menuButton.addEventListener('click', toggleMenu);

	menuItems.forEach(item => {
		item.addEventListener('click', function () {
			toggleMenu(); // This will close the menu and show images
			// Add navigation logic here if needed
		});
	});

	document.querySelector('.menu-overlay').style.zIndex = '20';
});