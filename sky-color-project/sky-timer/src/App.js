import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './App.css';

// Configuration constants
const CONFIG = {
  TOTAL_DURATION: 60 * 60 * 1000,  // 1 hour in milliseconds
  TRANSITION_DURATION: 1000,        // 1 second transition
  PALETTES_PER_CYCLE: 8            // Number of color palettes
};

// Calculate duration for each palette
const PALETTE_DURATION = Math.floor(
  (CONFIG.TOTAL_DURATION - (CONFIG.PALETTES_PER_CYCLE * CONFIG.TRANSITION_DURATION))
  / CONFIG.PALETTES_PER_CYCLE
);

// Color palettes
const colorPalettes = [
  ['#E5D9F2', '#F5EFFF', '#CDC1FF', '#A594F9'],         // palette 2
  ['#78C1F3', '#9BE8D8', '#E2F6CA', '#F8FDCF'],         // palette 3
  ['#00A9FF', '#89CFF3', '#A0E9FF', '#CDF5FD'],         // palette 4
  ['#A26EA1', '#F18A9B', '#FFB480', '#FFFF9D'],         // palette 1
  ['#FFF100', '#006BFF', '#08C2FF', '#BCF2F6'],         // palette 6
  ['#3572EF', '#3ABEF9', '#050C9C', '#A7E6FF'],         // palette 5
  ['#FEFFD2', '#FFEEA9', '#FFBF78', '#FF7D29'],         // palette 5
  ['#FFB200', '#EB5B00', '#E4003A', '#B60071'],         // palette 7
  ['#2E0249', '#570A57', '#A91079', '#F806CC'],         // palette 8
];

function App() {
  const mountRef = useRef(null);
  const timerStart = useRef(Date.now());
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentPaletteIndex, setCurrentPaletteIndex] = useState(0);
  const [elapsedPercent, setElapsedPercent] = useState(0);

  // Timer formatting function
  const formatTime = (elapsed) => {
    const hours = Math.floor(elapsed / (60 * 60 * 1000));
    const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((elapsed % (60 * 1000)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    // Store ref in variable for cleanup
    const mountElement = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountElement.appendChild(renderer.domElement);

    // Camera position
    camera.position.set(0, 0.8, 0);
    camera.lookAt(0, 0, 0);


    // Water geometry
    const geometry = new THREE.PlaneGeometry(4, 4, 128, 128);

    // Helper function to interpolate between hex colors
    const lerpColor = (color1, color2, t) => {
      // Convert hex to RGB
      const c1 = {
        r: parseInt(color1.slice(1, 3), 16),
        g: parseInt(color1.slice(3, 5), 16),
        b: parseInt(color1.slice(5, 7), 16)
      };
      const c2 = {
        r: parseInt(color2.slice(1, 3), 16),
        g: parseInt(color2.slice(3, 5), 16),
        b: parseInt(color2.slice(5, 7), 16)
      };

      // Interpolate
      const r = Math.round(c1.r + (c2.r - c1.r) * t);
      const g = Math.round(c1.g + (c2.g - c1.g) * t);
      const b = Math.round(c1.b + (c2.b - c1.b) * t);

      // Convert back to hex
      return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    };

    // Create gradient texture with transition
    const createSkyGradient = (currentPalette, nextPalette, transition) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, 0, 512);

      const currentColors = colorPalettes[currentPalette];
      const nextColors = colorPalettes[nextPalette];

      // Interpolate between each color in the palettes
      currentColors.forEach((color, index) => {
        const interpolatedColor = lerpColor(color, nextColors[index], transition);
        gradient.addColorStop(index / (currentColors.length - 1), interpolatedColor);
      });

      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 512);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    // Update material with new palette
    const updatePalette = (paletteIndex) => {
      waterMaterial.uniforms.skyTexture.value = createSkyGradient(paletteIndex);
    };

    // Initial setup with first palette
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        skyTexture: { value: createSkyGradient(0, 1, 0) }
      },
      vertexShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        // Improved noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187,
                            0.366025403784439,
                            -0.577350269189626,
                            0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          vec3 pos = position;

          // Increased frequency (smaller noise) by using larger multipliers
          float noise1 = snoise(vec2(position.x * 0.3 + time * 0.3, position.y * 0.3 + time * 0.2)) * 0.3;
          float noise2 = snoise(vec2(position.x * 0.5 - time * 0.15, position.y * 0.5 + time * 0.1)) * 0.2;
          float noise3 = snoise(vec2(position.x * 0.8 + time * 0.1, position.y * 0.8 - time * 0.15)) * 0.1;

          // Combine waves with reduced amplitude
          pos.z += (noise1 + noise2 + noise3) * 0.4;

          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D skyTexture;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(cameraPosition - vPosition);

          // Enhanced Fresnel effect
          float fresnel = pow(1.0 - dot(normal, viewDir), 5.0);
          fresnel = mix(0.1, 1.0, fresnel);

          // Dynamic reflection vector
          vec3 reflection = reflect(-viewDir, normal);
          vec2 skyUV = vec2(
            0.5 + reflection.x * 0.5,
            0.5 + reflection.y * 0.5
          );

          // Sample sky texture with better blending
          vec3 skyColor = texture2D(skyTexture, skyUV).rgb;
          vec3 waterColor = vec3(0.0, 0.15, 0.2);

          // Add specular highlight
          float specular = pow(max(dot(reflection, vec3(0.0, 1.0, 0.0)), 0.0), 32.0);

          vec3 finalColor = mix(waterColor, skyColor, fresnel);
          finalColor += vec3(specular) * 0.5;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });

    const water = new THREE.Mesh(geometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    scene.add(water);



    let currentPalette = 0;
    let nextPalette = 1;
    const startTime = Date.now();

    const animate = () => {
      requestAnimationFrame(animate);

      // Update timer and progress
      const elapsed = Date.now() - startTime;
      setCurrentTime(formatTime(elapsed));
      setElapsedPercent((elapsed / CONFIG.TOTAL_DURATION) * 100);

      if (!isPlaying) return;

      // Update water animation
      waterMaterial.uniforms.time.value += 0.01;

      // Calculate which palette we should be on
      const totalPaletteDuration = PALETTE_DURATION + CONFIG.TRANSITION_DURATION;
      const currentCycleTime = elapsed % CONFIG.TOTAL_DURATION;
      const currentPaletteIndex = Math.min(
        Math.floor(currentCycleTime / totalPaletteDuration),
        CONFIG.PALETTES_PER_CYCLE - 1
      );

      // Calculate transition progress
      const timeInCurrentPalette = currentCycleTime - (currentPaletteIndex * totalPaletteDuration);

      if (timeInCurrentPalette > PALETTE_DURATION) {
        // During transition
        const transitionProgress = (timeInCurrentPalette - PALETTE_DURATION) / CONFIG.TRANSITION_DURATION;
        const nextPaletteIndex = Math.min(currentPaletteIndex + 1, CONFIG.PALETTES_PER_CYCLE - 1);

        waterMaterial.uniforms.skyTexture.value = createSkyGradient(
          currentPaletteIndex,
          nextPaletteIndex,
          transitionProgress
        );
      } else {
        // During stable palette
        waterMaterial.uniforms.skyTexture.value = createSkyGradient(
          currentPaletteIndex,
          currentPaletteIndex,
          0
        );
      }

      // Update current palette index for UI
      setCurrentPaletteIndex(currentPaletteIndex);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup using stored ref
    return () => {
      mountElement.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [isPlaying]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      <div className="ui-container">
        {/* Timer */}
        <div className="timer">
          <div className="timer-display">{currentTime}</div>
          {/* <button
            className="play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button> */}
        </div>

        {/* Control Panel */}
        {/* <div className="control-panel">
          <div>Current Palette: {currentPaletteIndex + 1}/8</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
          <div className="palette-preview">
            {colorPalettes[currentPaletteIndex].map((color, index) => (
              <div
                key={index}
                className="color-box"
                style={{ background: color }}
              />
            ))}
          </div>
        </div> */}

        {/* Info Panel */}
        <div className="info-panel">
          <div>Total Duration: 1 hour</div>
          <div>Transitions: {CONFIG.TRANSITION_DURATION / 1000}s</div>
          <div>Progress: {Math.round(elapsedPercent)}%</div>
        </div>
      </div>
    </div>
  );
}

export default App;