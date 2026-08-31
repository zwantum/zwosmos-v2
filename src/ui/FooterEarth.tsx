import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function FooterEarth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  
  // Load textures
  const [colorMap, nightMap] = useTexture([
    '/assets/img/planets/earth.jpg',
    '/assets/img/planets/earthnight.jpg'
  ]);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <mesh ref={earthRef} position={[0, -11.5, -2]} rotation={[0.4, 4.0, 0]}>
      <sphereGeometry args={[12, 128, 128]} />
      <meshStandardMaterial 
        map={colorMap} 
        emissiveMap={nightMap}
        emissive={new THREE.Color('#ffffff')}
        emissiveIntensity={2.0}
        roughness={0.7} 
        metalness={0.1} 
      />
    </mesh>
  );
}
