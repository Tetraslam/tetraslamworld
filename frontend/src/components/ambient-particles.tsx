"use client";

import { useEffect, useRef } from "react";

interface Petal {
	x: number;
	y: number;
	size: number;
	speedX: number;
	speedY: number;
	rotation: number;
	rotationSpeed: number;
	opacity: number;
	swayOffset: number;
	swaySpeed: number;
}

export function AmbientParticles() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const petalsRef = useRef<Petal[]>([]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resize();
		window.addEventListener("resize", resize);

		// More petals, more prominent
		const petalCount = Math.floor(
			(window.innerWidth * window.innerHeight) / 250000
		);
		petalsRef.current = Array.from({ length: Math.min(petalCount, 50) }, () =>
			createPetal(canvas)
		);

		let lastTime = 0;
		const animate = (time: number) => {
			const delta = (time - lastTime) / 1000;
			lastTime = time;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			petalsRef.current.forEach((petal, i) => {
				// Update position with gentle sway
				petal.x +=
					petal.speedX +
					Math.sin(time * petal.swaySpeed + petal.swayOffset) * 0.5;
				petal.y += petal.speedY;
				petal.rotation += petal.rotationSpeed;

				// Reset if off screen
				if (
					petal.y > canvas.height + 30 ||
					petal.x < -30 ||
					petal.x > canvas.width + 30
				) {
					petalsRef.current[i] = createPetal(canvas, true);
				}

				// Draw petal with glow
				ctx.save();
				ctx.translate(petal.x, petal.y);
				ctx.rotate(petal.rotation);

				// Soft glow effect
				ctx.shadowColor = "rgba(232, 166, 166, 0.5)";
				ctx.shadowBlur = 8;

				// Petal shape
				ctx.beginPath();
				ctx.fillStyle = `rgba(232, 166, 166, ${petal.opacity})`;

				// Draw a petal shape
				ctx.moveTo(0, -petal.size);
				ctx.bezierCurveTo(
					petal.size * 0.7,
					-petal.size * 0.3,
					petal.size * 0.7,
					petal.size * 0.3,
					0,
					petal.size
				);
				ctx.bezierCurveTo(
					-petal.size * 0.7,
					petal.size * 0.3,
					-petal.size * 0.7,
					-petal.size * 0.3,
					0,
					-petal.size
				);
				ctx.fill();

				ctx.restore();
			});

			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener("resize", resize);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 pointer-events-none -z-[1]"
			aria-hidden="true"
		/>
	);
}

function createPetal(canvas: HTMLCanvasElement, fromTop = false): Petal {
	return {
		x: Math.random() * canvas.width,
		y: fromTop ? -30 : Math.random() * canvas.height,
		size: 5 + Math.random() * 7,
		speedX: -0.3 + Math.random() * 0.6,
		speedY: 0.4 + Math.random() * 0.6,
		rotation: Math.random() * Math.PI * 2,
		rotationSpeed: (Math.random() - 0.5) * 0.03,
		opacity: 0.25 + Math.random() * 0.35,
		swayOffset: Math.random() * Math.PI * 2,
		swaySpeed: 0.0008 + Math.random() * 0.0012,
	};
}
