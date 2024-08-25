new p5(function (p) {
  let engine, world;
  let topCircle, worksSquare;
  let isMenuActive = false;
  const shapeSize = 230;
  let walls = [];
  let gyroX = 0, gyroY = 0;

  p.setup = function () {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('p5-canvas');

    const Engine = Matter.Engine;
    const World = Matter.World;
    const Bodies = Matter.Bodies;

    engine = Engine.create();
    world = engine.world;

    engine.world.gravity.y = 0.98;

    topCircle = Bodies.circle(shapeSize, -shapeSize, shapeSize / 2, {
      restitution: 0.8,
      friction: 0.1,
      frictionAir: 0.01,
      label: 'TOP'
    });

    worksSquare = Bodies.rectangle(shapeSize * 2, -shapeSize, shapeSize, shapeSize, {
      restitution: 0.3,
      friction: 0.1,
      frictionAir: 0.01,
      label: 'WORKS'
    });


    p.setMenuActive = function (active) {
      isMenuActive = active;

      if (active) {
        // Adjust these values to change the starting positions
        const topCircleStartX = p.width * 0.2; // 25% from the left
        const topCircleStartY = -shapeSize; // Just above the top of the screen
        const worksSquareStartX = p.width * 0.3; // 75% from the left
        const worksSquareStartY = -shapeSize; // Just above the top of the screen

        // Set positions
        Matter.Body.setPosition(topCircle, { x: topCircleStartX, y: topCircleStartY });
        Matter.Body.setPosition(worksSquare, { x: worksSquareStartX, y: worksSquareStartY });

        // Set initial rotations (in radians)
        Matter.Body.setAngle(topCircle, p.PI / 2); // 45 degrees
        Matter.Body.setAngle(worksSquare, p.PI / 3); // 30 degrees

        // Reset velocities
        Matter.Body.setVelocity(topCircle, { x: 0, y: 10 });
        Matter.Body.setVelocity(worksSquare, { x: 0, y: -10 });

        // Optionally, add some initial velocity
        Matter.Body.setVelocity(topCircle, { x: p.random(-2, 2), y: 0 });
        Matter.Body.setVelocity(worksSquare, { x: p.random(-2, 2), y: 0 });
      }
    };

    World.add(world, [topCircle, worksSquare]);

    const wallOptions = { isStatic: true, restitution: 0.3 };
    walls = [
      Bodies.rectangle(p.width / 2, p.height + 50, p.width, 100, wallOptions),
      Bodies.rectangle(-50, p.height / 2, 100, p.height, wallOptions),
      Bodies.rectangle(p.width + 50, p.height / 2, 100, p.height, wallOptions),
    ];
    World.add(world, walls);

    // Setup gyroscope event listener
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  p.setGyroData = function (x, y) {
    gyroX = x;
    gyroY = y;

    // Update gyro display
    const gyroDisplay = document.getElementById('gyro-display');
    if (gyroDisplay) {
      gyroDisplay.textContent = `Gyro X: ${x.toFixed(2)}\nGyro Y: ${y.toFixed(2)}`;
    }
  };



  p.draw = function () {
    if (!isMenuActive) {
      p.clear();
      return;
    }

    p.clear(); // Use clear instead of background to make it transparent
    Matter.Engine.update(engine);

    // Apply gyroscope forces
    Matter.Body.applyForce(topCircle, topCircle.position, { x: gyroX * 0.1, y: -gyroY * 0.1 });
    Matter.Body.applyForce(worksSquare, worksSquare.position, { x: gyroX * 0.1, y: -gyroY * 0.1 });

    constrainPosition(topCircle);
    constrainPosition(worksSquare);

    // Draw circle
    p.push();
    p.translate(topCircle.position.x, topCircle.position.y);
    p.rotate(topCircle.angle);
    p.fill(0, 144, 255, 255); // Added some transparency
    p.ellipse(0, 0, shapeSize);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text('TOP', 0, 0);
    p.pop();

    // Draw square
    p.push();
    p.translate(worksSquare.position.x, worksSquare.position.y);
    p.rotate(worksSquare.angle);
    p.fill(255, 0, 0, 255); // Added some transparency
    p.rectMode(p.CENTER);
    p.rect(0, 0, shapeSize, shapeSize);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text('WORKS', 0, 0);
    p.pop();

  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    Matter.Body.setPosition(walls[0], { x: p.width / 2, y: p.height + 50 });
    Matter.Body.setPosition(walls[2], { x: p.width + 50, y: p.height / 2 });
  };

  p.mousePressed = function () {
    if (!isMenuActive) return;
    const mouseVector = Matter.Vector.create(p.mouseX, p.mouseY);
    const bodies = Matter.Composite.allBodies(world);
    const clickedBody = Matter.Query.point(bodies, mouseVector)[0];

    if (clickedBody) {
      if (clickedBody.label === 'TOP') {
        window.location.href = 'index.html';
      } else if (clickedBody.label === 'WORKS') {
        window.location.href = 'works.html';
      }
    }
  };

  p.setMenuActive = function (active) {
    isMenuActive = active;
    if (active) {
      Matter.Body.setPosition(topCircle, { x: shapeSize, y: -shapeSize });
      Matter.Body.setPosition(worksSquare, { x: shapeSize * 2, y: -shapeSize });
      Matter.Body.setVelocity(topCircle, { x: 0, y: 0 });
      Matter.Body.setVelocity(worksSquare, { x: 0, y: 0 });
    }
  };

  function constrainPosition(body) {
    const minX = shapeSize / 2;
    const maxX = p.width - shapeSize / 2;
    const minY = shapeSize / 2;
    const maxY = p.height - shapeSize / 2;

    if (body.position.x < minX) Matter.Body.setPosition(body, { x: minX, y: body.position.y });
    if (body.position.x > maxX) Matter.Body.setPosition(body, { x: maxX, y: body.position.y });
    if (body.position.y < minY) Matter.Body.setPosition(body, { x: body.position.x, y: minY });
    if (body.position.y > maxY) Matter.Body.setPosition(body, { x: body.position.x, y: maxY });
  }

  window.p5Instance = p;
});