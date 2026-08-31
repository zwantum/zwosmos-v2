"use client";

import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { usePointer } from "./PointerContext";

type EarthProps = {
  reducedMotion?: boolean;
  isMobile?: boolean;
};

// Custom Fresnel Shader for Electric Blue Atmospheric Rim Glow
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
    gl_FragColor = vec4(0.2, 0.55, 1.0, 1.0) * intensity * 1.8;
  }
`;

export default function Earth({ reducedMotion = false, isMobile = false }: EarthProps) {
  const group = useRef<THREE.Group>(null);
  const surfaceMesh = useRef<THREE.Mesh>(null);
  const cloudsMesh = useRef<THREE.Mesh>(null);
  const pointer = usePointer();

  // Load all 5 high-res NASA Earth texture maps
  const [dayMap, nightMap, cloudsMap, normalMap, specularMap] = useTexture([
    "/earth/day.jpg",
    "/earth/night.png",
    "/earth/clouds.png",
    "/earth/normal.jpg",
    "/earth/specular.jpg",
  ]);

  useLayoutEffect(() => {
    if (dayMap) dayMap.colorSpace = THREE.SRGBColorSpace;
    if (nightMap) nightMap.colorSpace = THREE.SRGBColorSpace;
    if (cloudsMap) cloudsMap.colorSpace = THREE.SRGBColorSpace;
  }, [dayMap, nightMap, cloudsMap]);

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      }),
    []
  );

  // Set initial orientation so India is in the center facing the viewer with realistic axial tilt
  useLayoutEffect(() => {
    if (surfaceMesh.current) {
      surfaceMesh.current.rotation.x = 0.38; // 22° axial tilt towards camera
      surfaceMesh.current.rotation.y = -2.55; // Longitude offset centering India (78° E)
    }
    if (cloudsMesh.current) {
      cloudsMesh.current.rotation.x = 0.38;
      cloudsMesh.current.rotation.y = -2.55;
    }
  }, [dayMap]);

  useFrame((_, delta) => {
    if (surfaceMesh.current && !reducedMotion) {
      surfaceMesh.current.rotation.y += delta * 0.04; // Smooth continuous auto-rotation
    }
    if (cloudsMesh.current && !reducedMotion) {
      cloudsMesh.current.rotation.y += delta * 0.055; // Swirling clouds rotate slightly faster
    }

    if (group.current) {
      const px = reducedMotion ? 0 : pointer.current.x * 0.3;
      const py = reducedMotion ? 0 : pointer.current.y * 0.3;
      group.current.position.x = THREE.MathUtils.lerp(
        group.current.position.x,
        px * 0.2,
        0.02
      );
      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y,
        (isMobile ? -0.2 : 0) - py * 0.15,
        0.02
      );
    }
  });

  const basePosition: [number, number, number] = isMobile
    ? [0, -0.2, -2.8]
    : [0, 0, -2.5];
  const radius = isMobile ? 1.5 : 2.2;

  return (
    <group ref={group} position={basePosition}>
      {/* Surface Globe: Blue Marble Day Map + Night City Lights + Bump + Specular Oceans */}
      <mesh ref={surfaceMesh}>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshStandardMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.9, 0.9)}
          roughnessMap={specularMap}
          roughness={0.25}
          metalness={0.05}
          emissiveMap={nightMap}
          emissive={new THREE.Color("#ffaa44")}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Swirling 3D Cloud Layer */}
      <mesh ref={cloudsMesh} scale={1.018}>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.65}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Electric Blue Atmospheric Rim Glow */}
      <mesh material={atmosphereMaterial} scale={1.06}>
        <sphereGeometry args={[radius, 96, 96]} />
      </mesh>
    </group>
  );
}

