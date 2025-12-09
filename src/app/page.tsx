"use client";

import { getCalApi } from "@calcom/embed-react";
import { track } from "@vercel/analytics";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const roles = [
	"builder",
	"roboticist",
	"worldbuilder",
	"engineer",
	"writer",
	"scuba diver",
	"angel investor",
];

// Holographic vertex shader
const holographicVertexShader = `
	varying vec3 vNormal;
	varying vec3 vPosition;
	varying vec2 vUv;
	uniform float uTime;
	uniform float uNoiseScale;
	
	// Simplex noise function
	vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
	vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
	
	float snoise(vec3 v) {
		const vec2 C = vec2(1.0/6.0, 1.0/3.0);
		const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
		vec3 i  = floor(v + dot(v, C.yyy));
		vec3 x0 = v - i + dot(i, C.xxx);
		vec3 g = step(x0.yzx, x0.xyz);
		vec3 l = 1.0 - g;
		vec3 i1 = min(g.xyz, l.zxy);
		vec3 i2 = max(g.xyz, l.zxy);
		vec3 x1 = x0 - i1 + C.xxx;
		vec3 x2 = x0 - i2 + C.yyy;
		vec3 x3 = x0 - D.yyy;
		i = mod289(i);
		vec4 p = permute(permute(permute(
			i.z + vec4(0.0, i1.z, i2.z, 1.0))
			+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
			+ i.x + vec4(0.0, i1.x, i2.x, 1.0));
		float n_ = 0.142857142857;
		vec3 ns = n_ * D.wyz - D.xzx;
		vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
		vec4 x_ = floor(j * ns.z);
		vec4 y_ = floor(j - 7.0 * x_);
		vec4 x = x_ *ns.x + ns.yyyy;
		vec4 y = y_ *ns.x + ns.yyyy;
		vec4 h = 1.0 - abs(x) - abs(y);
		vec4 b0 = vec4(x.xy, y.xy);
		vec4 b1 = vec4(x.zw, y.zw);
		vec4 s0 = floor(b0)*2.0 + 1.0;
		vec4 s1 = floor(b1)*2.0 + 1.0;
		vec4 sh = -step(h, vec4(0.0));
		vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
		vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
		vec3 p0 = vec3(a0.xy, h.x);
		vec3 p1 = vec3(a0.zw, h.y);
		vec3 p2 = vec3(a1.xy, h.z);
		vec3 p3 = vec3(a1.zw, h.w);
		vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
		p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
		vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
		m = m * m;
		return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
	}
	
	void main() {
		vNormal = normalize(normalMatrix * normal);
		vPosition = position;
		vUv = uv;
		
		// Noise displacement
		float noise = snoise(position * 2.0 + uTime * 0.3) * uNoiseScale;
		vec3 displaced = position + normal * noise;
		
		gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
	}
`;

// Holographic fragment shader
const holographicFragmentShader = `
	varying vec3 vNormal;
	varying vec3 vPosition;
	varying vec2 vUv;
	uniform float uTime;
	uniform vec3 uColor1;
	uniform vec3 uColor2;
	uniform vec3 uColor3;
	uniform float uOpacity;
	uniform float uFlash;
	
	void main() {
		// Fresnel effect for holographic edge glow
		vec3 viewDirection = normalize(cameraPosition - vPosition);
		float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
		
		// Iridescent color shift based on view angle and time
		float hue = dot(vNormal, viewDirection) * 0.5 + 0.5 + uTime * 0.1;
		vec3 iridescentColor = mix(
			mix(uColor1, uColor2, sin(hue * 3.14159) * 0.5 + 0.5),
			uColor3,
			sin(hue * 6.28318 + 1.0) * 0.5 + 0.5
		);
		
		// Circuit pattern
		float circuit = 0.0;
		float lineWidth = 0.03;
		vec3 absPos = abs(vPosition);
		if (mod(absPos.x + absPos.y, 0.3) < lineWidth || 
			mod(absPos.y + absPos.z, 0.3) < lineWidth ||
			mod(absPos.x + absPos.z, 0.3) < lineWidth) {
			circuit = 1.0;
		}
		
		// Combine effects
		vec3 finalColor = mix(iridescentColor, vec3(1.0), circuit * 0.3);
		finalColor += fresnel * uColor1 * 0.5;
		
		// Flash effect on click
		finalColor = mix(finalColor, vec3(1.0), uFlash * 0.8);
		
		// Pulsing glow
		float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
		
		gl_FragColor = vec4(finalColor * pulse, uOpacity + fresnel * 0.3 + uFlash * 0.5);
	}
`;

function Tetrahedron() {
	const containerRef = useRef<HTMLDivElement>(null);
	const mouseRef = useRef({ x: 0, y: 0 });

	useEffect(() => {
		if (!containerRef.current) return;
		
		// Capture container for cleanup
		const container = containerRef.current;
		
		// Clear any existing canvas (fixes navigation re-mount issue)
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		const width = 280;
		const height = 200;
		
		// Scene setup
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
		camera.position.z = 2.8; // Closer camera = bigger tetrahedra

		const renderer = new THREE.WebGLRenderer({ 
			antialias: true, 
			alpha: true 
		});
		renderer.setSize(width, height);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		container.appendChild(renderer.domElement);

		// Create main group for mouse parallax
		const mainGroup = new THREE.Group();
		scene.add(mainGroup);

		// Theme colors
		const roseColor = new THREE.Color(0xe8a6a6);
		const roseDeep = new THREE.Color(0xd46a7a);
		const mutedColor = new THREE.Color(0x9a8f94);

		// ========== INNER TETRAHEDRON (solid crystal) ==========
		const innerGeometry = new THREE.TetrahedronGeometry(0.6, 0);
		const innerMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uColor1: { value: roseColor },
				uColor2: { value: roseDeep },
				uColor3: { value: mutedColor },
				uOpacity: { value: 0.9 },
				uNoiseScale: { value: 0.02 },
				uFlash: { value: 0 },
			},
			vertexShader: holographicVertexShader,
			fragmentShader: holographicFragmentShader,
			transparent: true,
			side: THREE.DoubleSide,
		});
		const innerTetra = new THREE.Mesh(innerGeometry, innerMaterial);
		mainGroup.add(innerTetra);

		// Inner wireframe with glow
		const innerWireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(innerGeometry),
			new THREE.LineBasicMaterial({ color: 0xe8a6a6, linewidth: 2 })
		);
		innerTetra.add(innerWireframe);

		// ========== OUTER TETRAHEDRON (translucent crystal) ==========
		const outerGeometry = new THREE.TetrahedronGeometry(1.0, 0);
		const outerMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uColor1: { value: roseColor },
				uColor2: { value: roseDeep },
				uColor3: { value: mutedColor },
				uOpacity: { value: 0.15 },
				uNoiseScale: { value: 0.03 },
				uFlash: { value: 0 },
			},
			vertexShader: holographicVertexShader,
			fragmentShader: holographicFragmentShader,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
		});
		const outerTetra = new THREE.Mesh(outerGeometry, outerMaterial);
		mainGroup.add(outerTetra);

		// Outer wireframe
		const outerWireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(outerGeometry),
			new THREE.LineBasicMaterial({ color: 0xe8a6a6, transparent: true, opacity: 0.4 })
		);
		outerTetra.add(outerWireframe);

		// ========== AFTERIMAGE TRAILS ==========
		const trailCount = 4;
		const trails: THREE.Mesh[] = [];
		for (let i = 0; i < trailCount; i++) {
			const trailGeometry = new THREE.TetrahedronGeometry(0.6 + i * 0.05, 0);
			const trailMaterial = new THREE.MeshBasicMaterial({
				color: roseColor,
				transparent: true,
				opacity: 0.08 - i * 0.015,
				side: THREE.DoubleSide,
				depthWrite: false,
			});
			const trail = new THREE.Mesh(trailGeometry, trailMaterial);
			trails.push(trail);
			mainGroup.add(trail);
		}

		// ========== VERTEX SPARKLES ==========
		const vertices = [
			new THREE.Vector3(1, 1, 1),
			new THREE.Vector3(-1, -1, 1),
			new THREE.Vector3(-1, 1, -1),
			new THREE.Vector3(1, -1, -1),
		].map(v => v.normalize().multiplyScalar(0.6));

		const sparkleGroup = new THREE.Group();
		const sparkleGeometry = new THREE.SphereGeometry(0.04, 8, 8);
		const sparkleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		
		const sparkles: THREE.Mesh[] = [];
		vertices.forEach((vertex) => {
			const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
			sparkle.position.copy(vertex);
			sparkleGroup.add(sparkle);
			sparkles.push(sparkle);
			
			// Point light at each vertex
			const light = new THREE.PointLight(0xe8a6a6, 0.3, 2);
			light.position.copy(vertex);
			sparkleGroup.add(light);
		});
		innerTetra.add(sparkleGroup);

		// ========== ORBITING PARTICLES ==========
		const particleCount = 30;
		const particlesGeometry = new THREE.BufferGeometry();
		const particlePositions = new Float32Array(particleCount * 3);
		const particleSpeeds: number[] = [];
		const particleRadii: number[] = [];
		const particleOffsets: number[] = [];

		for (let i = 0; i < particleCount; i++) {
			const radius = 1.3 + Math.random() * 0.5;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.random() * Math.PI;
			
			particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
			particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
			particlePositions[i * 3 + 2] = radius * Math.cos(phi);
			
			particleSpeeds.push(0.2 + Math.random() * 0.3);
			particleRadii.push(radius);
			particleOffsets.push(Math.random() * Math.PI * 2);
		}

		particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
		
		const particlesMaterial = new THREE.PointsMaterial({
			color: 0xe8a6a6,
			size: 0.05,
			transparent: true,
			opacity: 0.8,
			blending: THREE.AdditiveBlending,
		});
		
		const particles = new THREE.Points(particlesGeometry, particlesMaterial);
		mainGroup.add(particles);

		// ========== ROTATION SPEEDS ==========
		const innerRotation = {
			x: (Math.random() - 0.5) * 0.008 + 0.003,
			y: (Math.random() - 0.5) * 0.008 + 0.005,
			z: (Math.random() - 0.5) * 0.004,
		};
		
		const outerRotation = {
			x: (Math.random() - 0.5) * 0.004 - 0.002,
			y: (Math.random() - 0.5) * 0.004 + 0.003,
			z: (Math.random() - 0.5) * 0.003,
		};

		// Trail rotation history
		const rotationHistory: { x: number; y: number; z: number }[] = [];

		// ========== CLICK BURST EFFECT ==========
		const burstParticleCount = 50;
		const burstGeometry = new THREE.BufferGeometry();
		const burstPositions = new Float32Array(burstParticleCount * 3);
		const burstVelocities: THREE.Vector3[] = [];
		const burstLifetimes: number[] = [];
		
		for (let i = 0; i < burstParticleCount; i++) {
			burstPositions[i * 3] = 0;
			burstPositions[i * 3 + 1] = 0;
			burstPositions[i * 3 + 2] = 0;
			burstVelocities.push(new THREE.Vector3());
			burstLifetimes.push(0);
		}
		
		burstGeometry.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
		
		const burstMaterial = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 0.08,
			transparent: true,
			opacity: 0,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});
		
		const burstParticles = new THREE.Points(burstGeometry, burstMaterial);
		mainGroup.add(burstParticles);

		// Click state
		let flashIntensity = 0;
		let rotationBoost = { x: 0, y: 0, z: 0 };
		let burstActive = false;

		const triggerBurst = () => {
			flashIntensity = 1;
			burstActive = true;
			burstMaterial.opacity = 1;
			
			// Random rotation boost
			rotationBoost = {
				x: (Math.random() - 0.5) * 0.15,
				y: (Math.random() - 0.5) * 0.15,
				z: (Math.random() - 0.5) * 0.1,
			};
			
			// Initialize burst particles with random outward velocities
			const positions = burstGeometry.attributes.position.array as Float32Array;
			for (let i = 0; i < burstParticleCount; i++) {
				// Start from center
				positions[i * 3] = 0;
				positions[i * 3 + 1] = 0;
				positions[i * 3 + 2] = 0;
				
				// Random direction
				const theta = Math.random() * Math.PI * 2;
				const phi = Math.random() * Math.PI;
				const speed = 0.08 + Math.random() * 0.12;
				
				burstVelocities[i].set(
					Math.sin(phi) * Math.cos(theta) * speed,
					Math.sin(phi) * Math.sin(theta) * speed,
					Math.cos(phi) * speed
				);
				burstLifetimes[i] = 1;
			}
			burstGeometry.attributes.position.needsUpdate = true;
		};

		// ========== MOUSE TRACKING ==========
		const handleMouseMove = (e: MouseEvent) => {
			const rect = containerRef.current?.getBoundingClientRect();
			if (rect) {
				mouseRef.current = {
					x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
					y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
				};
			}
		};
		window.addEventListener('mousemove', handleMouseMove);

		const handleClick = () => {
			triggerBurst();
		};
		container.addEventListener('click', handleClick);

		// ========== ANIMATION ==========
		const clock = new THREE.Clock();
		let animationId: number;

		const animate = () => {
			animationId = requestAnimationFrame(animate);
			const time = clock.getElapsedTime();

			// Update shader uniforms
			innerMaterial.uniforms.uTime.value = time;
			outerMaterial.uniforms.uTime.value = time;
			
			// Flash decay
			flashIntensity *= 0.92;
			innerMaterial.uniforms.uFlash.value = flashIntensity;
			outerMaterial.uniforms.uFlash.value = flashIntensity;
			
			// Rotation boost decay
			rotationBoost.x *= 0.96;
			rotationBoost.y *= 0.96;
			rotationBoost.z *= 0.96;

			// Rotate tetrahedra (with boost)
			innerTetra.rotation.x += innerRotation.x + rotationBoost.x;
			innerTetra.rotation.y += innerRotation.y + rotationBoost.y;
			innerTetra.rotation.z += innerRotation.z + rotationBoost.z;

			outerTetra.rotation.x += outerRotation.x - rotationBoost.x * 0.5;
			outerTetra.rotation.y += outerRotation.y - rotationBoost.y * 0.5;
			outerTetra.rotation.z += outerRotation.z - rotationBoost.z * 0.5;
			
			// Update burst particles
			if (burstActive) {
				const positions = burstGeometry.attributes.position.array as Float32Array;
				let allDead = true;
				
				for (let i = 0; i < burstParticleCount; i++) {
					if (burstLifetimes[i] > 0) {
						allDead = false;
						// Update position
						positions[i * 3] += burstVelocities[i].x;
						positions[i * 3 + 1] += burstVelocities[i].y;
						positions[i * 3 + 2] += burstVelocities[i].z;
						
						// Slow down
						burstVelocities[i].multiplyScalar(0.96);
						
						// Decay lifetime
						burstLifetimes[i] -= 0.02;
					}
				}
				
				burstGeometry.attributes.position.needsUpdate = true;
				burstMaterial.opacity = Math.max(0, burstMaterial.opacity - 0.025);
				
				if (allDead || burstMaterial.opacity <= 0) {
					burstActive = false;
					burstMaterial.opacity = 0;
				}
			}

			// Store rotation history for trails
			rotationHistory.unshift({
				x: innerTetra.rotation.x,
				y: innerTetra.rotation.y,
				z: innerTetra.rotation.z,
			});
			if (rotationHistory.length > trailCount * 5) {
				rotationHistory.pop();
			}

			// Update trails (afterimage)
			trails.forEach((trail, i) => {
				const historyIndex = (i + 1) * 4;
				if (rotationHistory[historyIndex]) {
					trail.rotation.x = rotationHistory[historyIndex].x;
					trail.rotation.y = rotationHistory[historyIndex].y;
					trail.rotation.z = rotationHistory[historyIndex].z;
				}
			});

			// Sparkle pulse
			sparkles.forEach((sparkle, i) => {
				const scale = 0.8 + Math.sin(time * 3 + i) * 0.4;
				sparkle.scale.setScalar(scale);
			});

			// Update orbiting particles
			const positions = particlesGeometry.attributes.position.array as Float32Array;
			for (let i = 0; i < particleCount; i++) {
				const speed = particleSpeeds[i];
				const radius = particleRadii[i];
				const offset = particleOffsets[i];
				
				const theta = time * speed + offset;
				const phi = time * speed * 0.5 + offset * 2;
				
				positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
				positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
				positions[i * 3 + 2] = radius * Math.cos(phi);
			}
			particlesGeometry.attributes.position.needsUpdate = true;

			// Mouse parallax
			mainGroup.rotation.y += (mouseRef.current.x * 0.3 - mainGroup.rotation.y) * 0.05;
			mainGroup.rotation.x += (mouseRef.current.y * 0.2 - mainGroup.rotation.x) * 0.05;

			renderer.render(scene, camera);
		};
		animate();

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('mousemove', handleMouseMove);
			container.removeEventListener('click', handleClick);
			renderer.dispose();
			innerGeometry.dispose();
			innerMaterial.dispose();
			outerGeometry.dispose();
			outerMaterial.dispose();
			particlesGeometry.dispose();
			particlesMaterial.dispose();
			sparkleGeometry.dispose();
			sparkleMaterial.dispose();
			burstGeometry.dispose();
			burstMaterial.dispose();
			trails.forEach(t => {
				t.geometry.dispose();
				(t.material as THREE.Material).dispose();
			});
			if (renderer.domElement.parentNode === container) {
				container.removeChild(renderer.domElement);
			}
		};
	}, []);

	return (
		<div 
			ref={containerRef} 
			className="w-[280px] h-[200px] animate-bob cursor-pointer"
			style={{ filter: "drop-shadow(0 12px 24px rgba(232, 166, 166, 0.4))" }}
		/>
	);
}

export default function Home() {
	const [currentRole, setCurrentRole] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	// Initialize Cal.com embed
	useEffect(() => {
		(async () => {
			const cal = await getCalApi({ namespace: "30min" });
			cal("ui", {
				theme: "dark",
				cssVarsPerTheme: {
					light: { "cal-brand": "#2B262B" },
					dark: { "cal-brand": "#E8A6A6" },
				},
				hideEventTypeDetails: false,
				layout: "month_view",
			});
		})();
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVisible(false);
			setTimeout(() => {
				setCurrentRole((prev) => (prev + 1) % roles.length);
				setIsVisible(true);
			}, 200);
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center p-8">
			<div className="max-w-2xl text-center space-y-8 animate-fade-in">
				{/* Tetrahedron */}
				<div className="flex flex-col items-center">
					<Tetrahedron />
					{/* Shadow underneath */}
					<div className="w-28 h-4 bg-rose/50 rounded-full blur-lg -mt-4 animate-bob-shadow" />
				</div>

				<div className="space-y-3">
					<h1 className="text-5xl font-bold tracking-tight">
						tetraslam's world
					</h1>
					<p className="text-lg text-muted-foreground">
						shresht bhowmick /{" "}
						<span
							className={`text-rose transition-opacity duration-200 inline-block min-w-[100px] ${
								isVisible ? "opacity-100" : "opacity-0"
							}`}
						>
							{roles[currentRole]}
						</span>
					</p>
				</div>

				<div className="text-sm text-muted-foreground space-y-1">
					<p>
						currently: founding engineer @{" "}
						<a
							href="https://natural.co"
							target="_blank"
							rel="noopener noreferrer"
							onClick={() => track("external_link_click", { url: "https://natural.co", label: "natural.co", source: "homepage" })}
							className="text-foreground hover:text-rose"
						>
							natural.co
						</a>
					</p>
					<p>
						prev:{" "}
						<a
							href="https://media.mit.edu"
							target="_blank"
							rel="noopener noreferrer"
							onClick={() => track("external_link_click", { url: "https://media.mit.edu", label: "mit media lab", source: "homepage" })}
							className="text-foreground/80 hover:text-rose"
						>
							mit media lab
						</a>
						,{" "}
						<a
							href="https://mosaic.so"
							target="_blank"
							rel="noopener noreferrer"
							onClick={() => track("external_link_click", { url: "https://mosaic.so", label: "mosaic", source: "homepage" })}
							className="text-foreground/80 hover:text-rose"
						>
							mosaic
						</a>
						, etc
					</p>
				</div>

				<div className="flex flex-wrap gap-3 justify-center text-sm">
					<SocialLink href="https://x.com/tetraslam" label="twitter" />
					<SocialLink href="https://github.com/tetraslam" label="github" />
					<SocialLink href="https://tetraslam.world/blog" label="blog" />
					<SocialLink href="mailto:bhowmickshresht@gmail.com" label="email" />
					<button
						type="button"
						data-cal-namespace="30min"
						data-cal-link="tetraslam/30min"
						data-cal-config='{"layout":"month_view","theme":"dark"}'
						onClick={() => track("book_call_click", { source: "homepage" })}
						className="px-4 py-2 border border-rose/50 bg-rose/10 rounded-lg hover:border-rose hover:bg-rose/20 hover:-translate-y-0.5 transition-all text-rose"
					>
						book a call
					</button>
				</div>

				<p className="text-xs text-muted-foreground/60">
					press{" "}
					<kbd className="px-1.5 py-0.5 bg-surface rounded border border-border text-rose text-xs">
						ctrl+k
					</kbd>{" "}
					to navigate
				</p>
			</div>
		</div>
	);
}

function SocialLink({ href, label }: { href: string; label: string }) {
	return (
		<a
			href={href}
			target={href.startsWith("mailto") ? undefined : "_blank"}
			rel={href.startsWith("mailto") ? undefined : "noopener noreferrer"}
			onClick={() => track("external_link_click", { url: href, label, source: "homepage" })}
			className="px-4 py-2 border border-border rounded-lg hover:border-rose/50 hover:bg-rose/5 hover:-translate-y-0.5 transition-all text-muted-foreground hover:text-foreground"
		>
			{label}
		</a>
	);
}
