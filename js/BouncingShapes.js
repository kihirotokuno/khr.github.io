const BouncingShapes = {
  init: function (containerId, numShapes = 5) {
    this.container = document.getElementById(containerId);
    this.showcase = document.querySelector('.top-showcase');
    this.shapeSize = window.innerWidth / 10;
    this.textSize = 12;
    this.gravity = 0.2;
    this.shapes = [];

    for (let i = 0; i < numShapes; i++) {
      const shape = this.createShape('polygon', 'explore');
      this.container.appendChild(shape);
      this.shapes.push(shape);
    }

    this.updateShapes();
    this.setupResizeHandler();
  },

  createShape: function (type, text) {
    const shape = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    shape.setAttribute("class", "bouncing-shape " + type);
    shape.setAttribute("width", this.shapeSize);
    shape.setAttribute("height", this.shapeSize);
    shape.setAttribute("viewBox", "0 0 100 100");

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    this.updatePolygonPoints(polygon);
    polygon.setAttribute("fill", "#EBFF00");
    polygon.setAttribute("stroke", "black");
    polygon.setAttribute("stroke-width", "1");
    shape.appendChild(polygon);

    const text_elem = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text_elem.setAttribute("x", "50");
    text_elem.setAttribute("y", "55");
    text_elem.setAttribute("text-anchor", "middle");
    text_elem.setAttribute("font-size", "12");
    text_elem.setAttribute("fill", "black");
    text_elem.textContent = text;
    shape.appendChild(text_elem);

    const showcaseRect = this.showcase.getBoundingClientRect();
    shape.style.position = "absolute";
    shape.style.left = `${Math.random() * (showcaseRect.width - this.shapeSize)}px`;
    shape.style.top = `${Math.random() * (showcaseRect.height - this.shapeSize)}px`;

    shape.points = this.createInitialPoints();
    shape.velocityX = (Math.random() - 0.5) * 2;
    shape.velocityY = (Math.random() - 0.5) * 2;

    return shape;
  },

  createInitialPoints: function () {
    const points = [];
    for (let i = 0; i < 32; i++) {
      const angle = i * Math.PI / 16;
      const x = 50 + 45 * Math.cos(angle);
      const y = 50 + 45 * Math.sin(angle);
      points.push({ x, y, initialX: x, initialY: y });
    }
    return points;
  },

  updatePolygonPoints: function (polygon, points = null) {
    if (!points) {
      points = this.createInitialPoints();
    }
    const pointsString = points.map(p => `${p.x},${p.y}`).join(" ");
    polygon.setAttribute("points", pointsString);
  },

  updateShapes: function () {
    const showcaseRect = this.showcase.getBoundingClientRect();

    this.shapes.forEach(shape => {
      shape.velocityY += this.gravity;

      let rect = shape.getBoundingClientRect();
      let newLeft = rect.left - showcaseRect.left + shape.velocityX;
      let newTop = rect.top - showcaseRect.top + shape.velocityY;

      // 壁との衝突
      if (newLeft <= 0 || newLeft + this.shapeSize >= showcaseRect.width) {
        shape.velocityX *= -0.1;
        newLeft = newLeft <= 0 ? 0 : showcaseRect.width - this.shapeSize;
      }

      if (newTop + this.shapeSize >= showcaseRect.height) {
        shape.velocityY *= -0.1;
        newTop = showcaseRect.height - this.shapeSize;
      }

      shape.style.left = `${newLeft}px`;
      shape.style.top = `${newTop}px`;

      this.updateShapePhysics(shape);
    });

    this.handleCollisions();

    requestAnimationFrame(() => this.updateShapes());
  },

  updateShapePhysics: function (shape) {
    const stiffness = 0.05;
    const damping = 0.7;

    shape.points.forEach((point, i) => {
      const forceX = (point.initialX - point.x) * stiffness;
      const forceY = (point.initialY - point.y) * stiffness;

      point.velocityX = (point.velocityX + forceX) * damping;
      point.velocityY = (point.velocityY + forceY) * damping;

      point.x += point.velocityX;
      point.y += point.velocityY;
    });

    const polygon = shape.querySelector('polygon');
    this.updatePolygonPoints(polygon, shape.points);
  },

  handleCollisions: function () {
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = i + 1; j < this.shapes.length; j++) {
        const shape1 = this.shapes[i];
        const shape2 = this.shapes[j];

        const rect1 = shape1.getBoundingClientRect();
        const rect2 = shape2.getBoundingClientRect();

        if (this.checkCollision(rect1, rect2)) {
          this.resolveCollision(shape1, shape2);
        }
      }
    }
  },

  checkCollision: function (rect1, rect2) {
    return !(rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom);
  },

  resolveCollision: function (shape1, shape2) {
    const elasticity = 0.1;

    const vCollision = { x: shape2.velocityX - shape1.velocityX, y: shape2.velocityY - shape1.velocityY };
    const distance = Math.sqrt(
      (shape2.offsetLeft - shape1.offsetLeft) * (shape2.offsetLeft - shape1.offsetLeft) +
      (shape2.offsetTop - shape1.offsetTop) * (shape2.offsetTop - shape1.offsetTop)
    );
    const vCollisionNorm = { x: vCollision.x / distance, y: vCollision.y / distance };
    const vRelativeVelocity = shape1.velocityX * vCollisionNorm.x + shape1.velocityY * vCollisionNorm.y;

    if (vRelativeVelocity > 0) return;

    const impulse = 2 * vRelativeVelocity * elasticity;

    shape1.velocityX += impulse * vCollisionNorm.x;
    shape1.velocityY += impulse * vCollisionNorm.y;
    shape2.velocityX -= impulse * vCollisionNorm.x;
    shape2.velocityY -= impulse * vCollisionNorm.y;
  },

  setupResizeHandler: function () {
    window.addEventListener('resize', () => {
      this.shapeSize = window.innerWidth / 10;
      this.shapes.forEach(shape => {
        shape.setAttribute("width", this.shapeSize);
        shape.setAttribute("height", this.shapeSize);
      });
    });
  }
};