"use client";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MeshTransmissionMaterial } from './MeshTransmissionMaterial';
import { GUI } from 'dat.gui';
import './globals.css';

import vertexShader from './shader/vertexShader.glsl';
import fragmentShader from './shader/fragmentShader.glsl';

THREE.ColorManagement.legacyMode = false;

const ThreeDScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const ambientLight = new THREE.AmbientLight();
    const pointLight = new THREE.PointLight();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f0f0f0');
    const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(15, 12, 13);
    camera.lookAt(0, -1, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.appendChild(renderer.domElement);
    // const controls = new OrbitControls(camera, renderer.domElement);

    const envLoader = new RGBELoader();
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();

    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
    gltfLoader.setDRACOLoader(dracoLoader);

    Promise.all([
      new Promise((res) => gltfLoader.load('/scene.glb', res)),
      new Promise((res) => envLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr', res))
    ]).then(([gltf, env]) => {
      scene.environment = env;
      scene.environment.mapping = THREE.EquirectangularReflectionMapping;

      scene.add(ambientLight);
      scene.add(pointLight);
      scene.add(gltf.scene);

      pointLight.position.set(10, 10, 10);

      // Calculate bounding box and center the object
      const bbox = new THREE.Box3().setFromObject(gltf.scene);
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3());

      // Scale the object
      const maxAxis = Math.max(size.x, size.y, size.z);
      gltf.scene.scale.multiplyScalar(15.0 / maxAxis);

      // Recalculate bounding box after scaling
      bbox.setFromObject(gltf.scene);
      bbox.getCenter(center);

      // Center the object
      gltf.scene.position.copy(center).multiplyScalar(-1);
      gltf.scene.position.y -= (size.y * 0.5);

      const cube1 = gltf.scene.getObjectByName('Water');
      cube1.material = Object.assign(new MeshTransmissionMaterial(10), {
        clearcoat: 0.4,
        clearcoatRoughness: 0,
        transmission: 0.85,
        chromaticAberration: 0.01,
        anisotrophicBlur: 0.1,
        roughness: 0.2,
        thickness: 2.6,
        ior: 1,
        distortion: 0.5,
        distortionScale: 0.32,
        temporalDistortion: 0.47,
        color: new THREE.Color(0x20B2AA),
        transparent: true,
        opacity: 0.77
      });

      // Add dat.GUI controls
      /* const gui = new GUI();
      const materialFolder = gui.addFolder('Material Properties');
      materialFolder.add(cube1.material, 'clearcoat', 0, 1);
      materialFolder.add(cube1.material, 'clearcoatRoughness', 0, 1);
      materialFolder.add(cube1.material, 'transmission', 0, 1);
      materialFolder.add(cube1.material, 'chromaticAberration', 0, 1);
      materialFolder.add(cube1.material, 'anisotrophicBlur', 0, 1);
      materialFolder.add(cube1.material, 'roughness', 0, 1);
      materialFolder.add(cube1.material, 'thickness', 0, 10);
      materialFolder.add(cube1.material, 'distortion', 0, 1);
      materialFolder.add(cube1.material, 'distortionScale', 0, 1);
      materialFolder.add(cube1.material, 'temporalDistortion', 0, 1);
      materialFolder.add(cube1.material, 'opacity', 0, 1);
      materialFolder.open(); */

      function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }

      window.addEventListener('resize', resize);
      resize();

      function animate(t) {
        requestAnimationFrame(animate);
        cube1.material.time = t / 1000;
        // controls.update();
        renderer.render(scene, camera);
      }

      animate();
    });

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeDScene;
