let shapes = [];
let showcaseElement;
const DAMPING = 0.98;
const COLLISION_ELASTICITY = 0.8;
const ROTATION_SPEED = 0.005;
const GRAVITY_SCALE = 0.1;

function setup() {
  showcaseElement = document.querySelector('.top-showcase');
  const showcaseRect = showcaseElement.getBoundingClientRect();

  const canvas = createCanvas(showcaseRect.width, showcaseRect.height);
  canvas.parent('p5-canvas');

  // Create one of each shape with larger sizes
  shapes.push(new Circle(width * 0.3, height * 0.5, 150));
  shapes.push(new Triangle(width * 0.5, height * 0.5, 150));
  shapes.push(new Rectangle(width * 0.7, height * 0.5, 150, 150));

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
  clear();

  shapes.forEach(shape => {
    shape.applyForce(acceleration);
    shape.update();
  });

  // Check for collisions and separate shapes
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      if (shapes[i].intersects(shapes[j])) {
        separateShapes(shapes[i], shapes[j]);
        shapes[i].collide(shapes[j]);
      }
    }
  }

  shapes.forEach(shape => shape.display());
}

function separateShapes(shape1, shape2) {
  let distance = p5.Vector.dist(shape1.pos, shape2.pos);
  let minDistance = shape1.getRadius() + shape2.getRadius();
  if (distance < minDistance) {
    let angle = atan2(shape2.pos.y - shape1.pos.y, shape2.pos.x - shape1.pos.x);
    let overlap = minDistance - distance;
    let separationVector = p5.Vector.fromAngle(angle).mult(overlap / 2);
    shape1.pos.sub(separationVector);
    shape2.pos.add(separationVector);
  }
}

class Shape {
  constructor(x, y, mass) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.mass = mass;
    this.rotation = random(TWO_PI); // Random starting rotation
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.mult(DAMPING);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
    this.rotation += ROTATION_SPEED;
    this.constrainToCanvas();
  }

  constrainToCanvas() {
    // To be implemented by subclasses
  }

  intersects(other) {
    // To be implemented by subclasses
  }

  collide(other) {
    let normal = p5.Vector.sub(other.pos, this.pos).normalize();
    let relativeVelocity = p5.Vector.sub(this.vel, other.vel);
    let speedAlongNormal = relativeVelocity.dot(normal);

    if (speedAlongNormal > 0) return;

    let impulseStrength = -(1 + COLLISION_ELASTICITY) * speedAlongNormal / (1 / this.mass + 1 / other.mass);
    let impulse = p5.Vector.mult(normal, impulseStrength);

    this.vel.add(p5.Vector.div(impulse, this.mass));
    other.vel.sub(p5.Vector.div(impulse, other.mass));
  }

  getRadius() {
    // To be implemented by subclasses
  }
}

class Circle extends Shape {
  constructor(x, y, diameter) {
    super(x, y, diameter * diameter * 0.01);
    this.diameter = diameter;
    this.radius = diameter / 2;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    fill('#EBFF00');
    stroke(0);
    strokeWeight(1);
    circle(0, 0, this.diameter);

    // Add "Explore" text
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.diameter * 0.15);
    text("Explore", 0, 0);

    pop();
  }

  constrainToCanvas() {
    if (this.pos.x - this.radius < 0) {
      this.pos.x = this.radius;
      this.vel.x *= -COLLISION_ELASTICITY;
    } else if (this.pos.x + this.radius > width) {
      this.pos.x = width - this.radius;
      this.vel.x *= -COLLISION_ELASTICITY;
    }
    if (this.pos.y - this.radius < 0) {
      this.pos.y = this.radius;
      this.vel.y *= -COLLISION_ELASTICITY;
    } else if (this.pos.y + this.radius > height) {
      this.pos.y = height - this.radius;
      this.vel.y *= -COLLISION_ELASTICITY;
    }
  }

  intersects(other) {
    let distance = p5.Vector.dist(this.pos, other.pos);
    return distance < this.getRadius() + other.getRadius();
  }

  getRadius() {
    return this.radius;
  }
}

class Triangle extends Shape {
  constructor(x, y, size) {
    super(x, y, size * size * 0.01);
    this.size = size;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    fill('#EBFF00');
    stroke(0);
    strokeWeight(1);
    triangle(
      0, -this.size / 2,
      -this.size / 2, this.size / 2,
      this.size / 2, this.size / 2
    );

    // Add "Bio" text
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.size * 0.2);
    text("Bio", 0, this.size * 0.1);

    pop();
  }

  constrainToCanvas() {
    if (this.pos.x - this.size / 2 < 0) {
      this.pos.x = this.size / 2;
      this.vel.x *= -COLLISION_ELASTICITY;
    } else if (this.pos.x + this.size / 2 > width) {
      this.pos.x = width - this.size / 2;
      this.vel.x *= -COLLISION_ELASTICITY;
    }
    if (this.pos.y - this.size / 2 < 0) {
      this.pos.y = this.size / 2;
      this.vel.y *= -COLLISION_ELASTICITY;
    } else if (this.pos.y + this.size / 2 > height) {
      this.pos.y = height - this.size / 2;
      this.vel.y *= -COLLISION_ELASTICITY;
    }
  }

  intersects(other) {
    let distance = p5.Vector.dist(this.pos, other.pos);
    return distance < this.getRadius() + other.getRadius();
  }

  getRadius() {
    return this.size / 2;
  }
}

class Rectangle extends Shape {
  constructor(x, y, width, height) {
    super(x, y, width * height * 0.01);
    this.width = width;
    this.height = height;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    fill('#EBFF00');
    stroke(0);
    strokeWeight(1);
    rect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Add "Contact" text
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.width * 0.15);
    text("Contact", 0, 0);

    pop();
  }

  constrainToCanvas() {
    if (this.pos.x - this.width / 2 < 0) {
      this.pos.x = this.width / 2;
      this.vel.x *= -COLLISION_ELASTICITY;
    } else if (this.pos.x + this.width / 2 > width) {
      this.pos.x = width - this.width / 2;
      this.vel.x *= -COLLISION_ELASTICITY;
    }
    if (this.pos.y - this.height / 2 < 0) {
      this.pos.y = this.height / 2;
      this.vel.y *= -COLLISION_ELASTICITY;
    } else if (this.pos.y + this.height / 2 > height) {
      this.pos.y = height - this.height / 2;
      this.vel.y *= -COLLISION_ELASTICITY;
    }
  }

  intersects(other) {
    let distance = p5.Vector.dist(this.pos, other.pos);
    return distance < this.getRadius() + other.getRadius();
  }

  getRadius() {
    return sqrt(this.width * this.width + this.height * this.height) / 2;
  }
}

function windowResized() {
  const showcaseRect = showcaseElement.getBoundingClientRect();
  resizeCanvas(showcaseRect.width, showcaseRect.height);

  // Update shape positions on resize
  shapes[0].pos.set(width * 0.3, height * 0.5);
  shapes[1].pos.set(width * 0.5, height * 0.5);
  shapes[2].pos.set(width * 0.7, height * 0.5);
}