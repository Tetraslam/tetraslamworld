import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
	return new ImageResponse(
		(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#221F22",
					fontFamily: "monospace",
					position: "relative",
				}}
			>
				{/* Background pattern - subtle grid */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						backgroundImage: `
							linear-gradient(rgba(232, 166, 166, 0.03) 1px, transparent 1px),
							linear-gradient(90deg, rgba(232, 166, 166, 0.03) 1px, transparent 1px)
						`,
						backgroundSize: "40px 40px",
					}}
				/>

				{/* Decorative tetrahedron shapes */}
				<div
					style={{
						position: "absolute",
						top: 80,
						left: 100,
						width: 0,
						height: 0,
						borderLeft: "40px solid transparent",
						borderRight: "40px solid transparent",
						borderBottom: "70px solid rgba(232, 166, 166, 0.15)",
						transform: "rotate(15deg)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: 100,
						right: 120,
						width: 0,
						height: 0,
						borderLeft: "30px solid transparent",
						borderRight: "30px solid transparent",
						borderBottom: "52px solid rgba(212, 106, 122, 0.2)",
						transform: "rotate(-10deg)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: 200,
						right: 200,
						width: 0,
						height: 0,
						borderLeft: "20px solid transparent",
						borderRight: "20px solid transparent",
						borderBottom: "35px solid rgba(232, 166, 166, 0.1)",
						transform: "rotate(45deg)",
					}}
				/>

				{/* Only title */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						width: "100%",
					}}
				>
					<div
						style={{
							fontSize: 72,
							fontWeight: 700,
							color: "#F7F4F1",
							letterSpacing: "-0.02em",
						}}
					>
						tetraslam's world
					</div>
				</div>

				{/* Corner accents */}
				<div
					style={{
						position: "absolute",
						top: 40,
						left: 40,
						width: 60,
						height: 60,
						borderTop: "2px solid #E8A6A6",
						borderLeft: "2px solid #E8A6A6",
						opacity: 0.5,
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: 40,
						right: 40,
						width: 60,
						height: 60,
						borderBottom: "2px solid #E8A6A6",
						borderRight: "2px solid #E8A6A6",
						opacity: 0.5,
					}}
				/>
			</div>
		),
		{
			width: 1200,
			height: 630,
		}
	);
}
