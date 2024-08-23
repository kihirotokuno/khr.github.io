function setup() {
  const showcaseElement = document.querySelector('.top-showcase');
  const showcaseRect = showcaseElement.getBoundingClientRect();

  createCanvas(showcaseRect.width, showcaseRect.height);
}

function draw() {
  background(255);
  // Your drawing code will go here
}

function windowResized() {
  const showcaseElement = document.querySelector('.top-showcase');
  const showcaseRect = showcaseElement.getBoundingClientRect();
  resizeCanvas(showcaseRect.width, showcaseRect.height);
}