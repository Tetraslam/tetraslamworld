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

				{/* Main content */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 24,
					}}
				>
					{/* Title */}
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

					{/* Subtitle */}
					<div
						style={{
							fontSize: 28,
							color: "#E8A6A6",
							display: "flex",
							gap: 16,
							alignItems: "center",
						}}
					>
						<span>builder</span>
						<span style={{ color: "#4A3B46" }}>/</span>
						<span>roboticist</span>
						<span style={{ color: "#4A3B46" }}>/</span>
						<span>worldbuilder</span>
					</div>

					{/* Decorative line */}
					<div
						style={{
							width: 200,
							height: 2,
							background: "linear-gradient(90deg, transparent, #E8A6A6, transparent)",
							marginTop: 8,
						}}
					/>

					{/* Footer */}
					<div
						style={{
							fontSize: 20,
							color: "#9A8F94",
							marginTop: 16,
						}}
					>
						founding engineer @ natural.co
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
