import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './SoftAurora.css';

interface SoftAuroraProps {
  speed?: number;
  scale?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  noiseFrequency?: number;
  noiseAmplitude?: number;
  bandHeight?: number;
  bandSpread?: number;
  octaveDecay?: number;
  layerOffset?: number;
  colorSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
}

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  ];
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  float glow1 = auroraGlow(t, shift);
  float glow2 = auroraGlow(t + uLayerOffset, shift);
  vec3 gradient1 = cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20));
  vec3 gradient2 = cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25));

  vec3 col = 0.99 * glow1 * gradient1 * uColor1;
  col += 0.99 * glow2 * gradient2 * uColor2;

  col *= uBrightness;

  // Soft edge fade at bottom and top borders to eliminate any sharp cutoff line
  float edgeFadeY = smoothstep(0.0, 0.20, uv.y) * smoothstep(1.0, 0.85, uv.y);
  col *= edgeFadeY;

  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

export default function SoftAurora({
  speed = 0.6,
  scale = 1.5,
  brightness = 1.0,
  color1 = '#f7f7f7',
  color2 = '#e100ff',
  noiseFrequency = 2.5,
  noiseAmplitude = 1.0,
  bandHeight = 0.5,
  bandSpread = 1.0,
  octaveDecay = 0.1,
  layerOffset = 0,
  colorSpeed = 1.0,
  enableMouseInteraction = true,
  mouseInfluence = 0.25
}: SoftAuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let renderer: Renderer | null = null;
    let gl: any = null;
    let program: any = null;
    let mesh: Mesh | null = null;
    let animationFrameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
      gl = renderer.gl;
      if (!gl) return;
      gl.clearColor(0, 0, 0, 0);

      const currentMouse = [0.5, 0.5];
      let targetMouse = [0.5, 0.5];

      function handleMouseMove(e: MouseEvent) {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
          targetMouse[0] = 0.5;
          targetMouse[1] = 0.5;
          currentMouse[0] = 0.5;
          currentMouse[1] = 0.5;
          return;
        }
        const rawX = (e.clientX - rect.left) / Math.max(rect.width, 1);
        const rawY = 1.0 - (e.clientY - rect.top) / Math.max(rect.height, 1);
        targetMouse[0] = Math.max(0.0, Math.min(1.0, rawX));
        targetMouse[1] = Math.max(0.0, Math.min(1.0, rawY));
      }

      function handleMouseLeave() {
        targetMouse[0] = 0.5;
        targetMouse[1] = 0.5;
      }

      function handleScroll() {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
          targetMouse[0] = 0.5;
          targetMouse[1] = 0.5;
          currentMouse[0] = 0.5;
          currentMouse[1] = 0.5;
        }
      }

      let lastW = 0;
      let lastH = 0;
      function resize() {
        if (!container || !renderer) return;
        const width = container.offsetWidth || window.innerWidth;
        const height = container.offsetHeight || window.innerHeight;
        if (width === lastW && height === lastH) return;
        lastW = width;
        lastH = height;
        renderer.setSize(width, height);
        if (program && gl?.canvas) {
          program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / Math.max(gl.canvas.height, 1)];
        }
      }

      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(container);
      window.addEventListener('resize', resize);
      window.addEventListener('scroll', handleScroll, { passive: true });
      resize();

      const geometry = new Triangle(gl);
      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / Math.max(gl.canvas.height, 1)] },
          uSpeed: { value: speed },
          uScale: { value: scale },
          uBrightness: { value: brightness },
          uColor1: { value: hexToVec3(color1) },
          uColor2: { value: hexToVec3(color2) },
          uNoiseFreq: { value: noiseFrequency },
          uNoiseAmp: { value: noiseAmplitude },
          uBandHeight: { value: bandHeight },
          uBandSpread: { value: bandSpread },
          uOctaveDecay: { value: octaveDecay },
          uLayerOffset: { value: layerOffset },
          uColorSpeed: { value: colorSpeed },
          uMouse: { value: new Float32Array([0.5, 0.5]) },
          uMouseInfluence: { value: mouseInfluence },
          uEnableMouse: { value: enableMouseInteraction }
        }
      });

      mesh = new Mesh(gl, { geometry, program });
      container.appendChild(gl.canvas);

      if (enableMouseInteraction) {
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
      }

      function update(time: number) {
        animationFrameId = requestAnimationFrame(update);
        if (!program || !renderer) return;
        try {
          program.uniforms.uTime.value = time * 0.001;

          if (enableMouseInteraction) {
            currentMouse[0] += 0.08 * (targetMouse[0] - currentMouse[0]);
            currentMouse[1] += 0.08 * (targetMouse[1] - currentMouse[1]);
            program.uniforms.uMouse.value[0] = currentMouse[0];
            program.uniforms.uMouse.value[1] = currentMouse[1];
          } else {
            program.uniforms.uMouse.value[0] = 0.5;
            program.uniforms.uMouse.value[1] = 0.5;
          }

          if (mesh) {
            renderer.render({ scene: mesh });
          }
        } catch {
          // Ignore WebGL transient render errors
        }
      }
      animationFrameId = requestAnimationFrame(update);

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (resizeObserver) resizeObserver.disconnect();
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', handleScroll);
        if (enableMouseInteraction) {
          window.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseleave', handleMouseLeave);
        }
        if (gl?.canvas && container.contains(gl.canvas)) {
          container.removeChild(gl.canvas);
        }
        try {
          gl?.getExtension('WEBGL_lose_context')?.loseContext();
        } catch {
          // ignore
        }
      };
    } catch (err) {
      console.warn('SoftAurora WebGL initialization safely bypassed:', err);
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }
  }, [speed, scale, brightness, color1, color2, noiseFrequency, noiseAmplitude, bandHeight, bandSpread, octaveDecay, layerOffset, colorSpeed, enableMouseInteraction, mouseInfluence]);

  return <div ref={containerRef} className="soft-aurora-container" />;
}
