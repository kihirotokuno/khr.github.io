



import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';

extend({ OrbitControls });

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
    return () => {
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

      analyserRef.current.fftSize = 2048;
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
    const theta = Array.from({ length: interpolatedWave.length }, (_, i) => i / interpolatedWave.length * Math.PI * 2 * 30);
    const r = interpolatedWave.map(v => v * 1000 - 0.9);
    const x_prime = r.map((r, i) => r * Math.cos(theta[i]));
    const y_prime = r.map((r, i) => r * Math.sin(theta[i]));
    const z_prime = newAudioData.map(d => d.time);

    setThreeDData(x_prime.map((x, i) => ({ x, y: y_prime[i], z: z_prime[i] })));

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

    const CameraControls = () => {
      const { camera, gl } = useThree();
      useEffect(() => {
        const controls = new OrbitControls(camera, gl.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        return () => {
          controls.dispose();
        };
      }, [camera, gl]);
      return null;
    };

    return (
      <>
        <line geometry={points} material={lineMaterial} />
        <CameraControls />
      </>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Audio Visualizer</h1>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          padding: '10px 20px',
          backgroundColor: isRecording ? '#ff4444' : '#4CAF50',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '45%' }}>
          <h2>2D Waveform</h2>
          <canvas ref={canvasRef} width={500} height={200} style={{ width: '100%', border: '1px solid #ddd' }} />

          <div style={{ height: '300px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={audioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} hide />
                <YAxis domain={[0, 2]} />
                <Tooltip />
                <Line type="monotone" dataKey="amplitude" stroke="#8884d8" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ width: '50%' }}>
          <h2>3D Visualization</h2>
          <div style={{ height: '500px' }}>
            <Canvas
              camera={{
                position: [0, 0, 2000],
                fov: 75,
                near: 0.1,
                far: 10000
              }}
            >
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <ThreeDVisualization />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioVisualizer;





