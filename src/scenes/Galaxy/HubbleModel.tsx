import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const HubbleModel: React.FC = () => {
  const { scene } = useGLTF('/assets/models/hubble.glb');
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);

  // Act like z-index: 999 by disabling depth testing and rendering last
  // Also tweak materials to ensure they aren't pitch black
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.renderOrder = 999;
        
        const tweakMaterial = (mat: THREE.Material) => {
          mat.depthTest = false;
          // Increase metalness and decrease roughness to bring out texture details
          if ((mat as THREE.MeshStandardMaterial).metalness !== undefined) {
            (mat as THREE.MeshStandardMaterial).metalness = 0.8;
            (mat as THREE.MeshStandardMaterial).roughness = 0.3;
          }
          mat.needsUpdate = true;
        };

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(tweakMaterial);
          } else {
            tweakMaterial(mesh.material);
          }
        }
      }
    });
  }, [scene]);

  // Set cursor to pointer when hovered
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  // Smooth hover scale effect
  useFrame(() => {
    if (groupRef.current) {
      const targetScale = hovered ? 0.22 : 0.2;
      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      groupRef.current.scale.set(newScale, newScale, newScale);
    }
  });

  return (
    <group position={[5.5, 1.5, 3.5]} rotation={[0.3, -0.4, 0.1]}>
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={1}
        floatingRange={[-0.1, 0.1]}
      >
        <group 
          ref={groupRef}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
        >
          <primitive object={scene} />
        </group>
        
        {/* Fill light */}
        <ambientLight intensity={2} color="white" />
        {/* Strong directional light for metallic gleam */}
        <directionalLight position={[5, 2, 5]} intensity={4} color="#ffffff" />
        {/* Sharp point light for specular reflection */}
        <pointLight position={[2, 0, 2]} intensity={6} color="#ffffff" distance={20} />
      </Float>
    </group>
  );
};

// Preload the model
useGLTF.preload('/assets/models/hubble.glb');

export default HubbleModel;
