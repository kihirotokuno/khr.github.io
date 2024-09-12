import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import './AudioVisualizer.css';

extend({ OrbitControls });

const CameraControls = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    return () => {
      controls.dispose();
    };
  }, [camera, gl]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null;
};

const AudioVisualizer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState([]);
  const [threeDData, setThreeDData] = useState([]);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafIdRef = useRef(null);


  useEffect(() => {
    const setVh = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh(); // 初期設定

    window.addEventListener('resize', setVh);
    return () => {
      window.removeEventListener('resize', setVh);

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      analyserRef.current.fftSize = 16384;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setIsRecording(true);
      drawWaveform();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    canvasCtx.beginPath();

    const sliceWidth = width * 1.0 / dataArrayRef.current.length;
    let x = 0;

    const newAudioData = [];
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const v = dataArrayRef.current[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
      newAudioData.push({ time: i, amplitude: v });
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

    // Update audio data for the chart
    setAudioData(newAudioData);

    // Generate 3D data
    const interpolatedWave = newAudioData.map(d => d.amplitude);
    const theta = Array.from({ length: interpolatedWave.length }, (_, i) => i / interpolatedWave.length * Math.PI * 2 * 120);
    const r = interpolatedWave.map(v => v * 1000 - 0.9);
    const x_prime = r.map((r, i) => r * Math.cos(theta[i]));
    const y_prime = r.map((r, i) => r * Math.sin(theta[i]));
    const z_prime = newAudioData.map(d => d.time * 2);

    // 中心に配置するために平均値を計算
    const avgX = x_prime.reduce((sum, val) => sum + val, 0) / x_prime.length;
    const avgY = y_prime.reduce((sum, val) => sum + val, 0) / y_prime.length;
    const avgZ = z_prime.reduce((sum, val) => sum + val, 0) / z_prime.length;

    setThreeDData(x_prime.map((x, i) => ({
      x: x - avgX,
      y: y_prime[i] - avgY,
      z: z_prime[i] - avgZ
    })));

    rafIdRef.current = requestAnimationFrame(drawWaveform);
  };

  const ThreeDVisualization = () => {
    const points = useMemo(() => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(threeDData.flatMap(({ x, y, z }) => [x, y, z]));
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return geometry;
    }, [threeDData]);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });

    useFrame(() => {
      // Add any animations or updates here if needed
    });



    return (
      <>
        <line geometry={points} material={lineMaterial} />
        {/* <CameraControls /> */}
      </>
    );
  };

  return (
    <div className="main">
      <div className="visualization-container">
        <canvas ref={canvasRef} width={500} height={200} style={{ width: '100%', height: '1px', visibility: 'hidden', position: 'absolute', top: 0, left: 0 }} />

        <div style={{ width: '100%', height: '100%' }}>
          <Canvas className="three-js-container" camera={{ position: [5000, 0, 0], fov: 75, near: 0.1, far: 100000 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <ThreeDVisualization />
            <CameraControls />
          </Canvas>
        </div>
      </div>

      <div className="top">
        <div className="div">音を、</div>
      </div>

      <div className="bottom">
        <button className={`button ${isRecording ? 'clicked' : ''}`} onClick={isRecording ? stopRecording : startRecording}>
          <div className="div2">{isRecording ? 'とめる' : 'きろく'}</div>
        </button>
      </div>
    </div>
  );
};

export default AudioVisualizer;