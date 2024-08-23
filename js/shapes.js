let rect, tri, circle;
const GRAVITY_SCALE = 0.1;

function setup() {
  const showcaseElement = document.querySelector('.top-showcase');
  const showcaseRect = showcaseElement.getBoundingClientRect();

  const canvas = createCanvas(showcaseRect.width, showcaseRect.height);
  canvas.parent('p5-canvas');

  // Create the three shapes
  rect = new Rectangle(width * 0.25, height * 0.5, 150, 150);
  tri = new Triangle(width * 0.5, height * 0.5, 150);
  circle = new Circle(width * 0.75, height * 0.5, 150);

  // Request accelerometer permission
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          window.addEventListener('devicemotion', updateAcceleration);
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener('devicemotion', updateAcceleration);
  }
}

let acceleration = createVector(0, 0);

function updateAcceleration(event) {
  acceleration.x = event.accelerationIncludingGravity.x * GRAVITY_SCALE;
  acceleration.y = event.accelerationIncludingGravity.y * GRAVITY_SCALE;
}

function draw() {
  background(255);

  [rect, tri, circle].forEach(shape => {
    shape.applyForce(acceleration);
    shape.update();
    shape.display();
  });
}

class Shape {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
    this.constrainToCanvas();
  }

  constrainToCanvas() {
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }
}

class Rectangle extends Shape {
  constructor(x, y, w, h) {
    super(x, y);
    this.w = w;
    this.h = h;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    fill('#EBFF00');
    stroke(0);
    strokeWeight(1);
    rectMode(CENTER);
    rect(0, 0, this.w, this.h);

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.w * 0.15);
    text("Contact", 0, 0);
    pop();
  }
}

class Triangle extends Shape {
  constructor(x, y, size) {
    super(x, y);
    this.size = size;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    fill('#EBFF00');
    stroke(0);
    strokeWeight(1);
    triangle(
      0, -this.size / 2,
      -this.size / 2, this.size / 2,
      this.size / 2, this.size / 2
    );

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.size * 0.2);
    text("Bio", 0, this.size * 0.1);
    pop();
  }
}

class Circle extends Shape {
  constructor(x, y, diameter) {
    super(x, y);
    this.diameter = diameter;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    fill('#EBFF00');
    stroke(0);
    strokeWeight(1);
    circle(0, 0, this.diameter);

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.diameter * 0.15);
    text("Explore", 0, 0);
    pop();
  }
}

function windowResized() {
  const showcaseElement = document.querySelector('.top-showcase');
  const showcaseRect = showcaseElement.getBoundingClientRect();
  resizeCanvas(showcaseRect.width, showcaseRect.height);

  // Update shape positions on resize
  rect.pos.set(width * 0.25, height * 0.5);
  tri.pos.set(width * 0.5, height * 0.5);
  circle.pos.set(width * 0.75, height * 0.5);
}