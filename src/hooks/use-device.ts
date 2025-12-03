"use client";

import { useEffect, useState } from "react";

export function useDevice() {
	const [isMobile, setIsMobile] = useState(false);
	const [isMac, setIsMac] = useState(false);

	useEffect(() => {
		// Check for mobile
		const checkMobile = () => {
			const mobile =
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent
				) || window.innerWidth < 768;
			setIsMobile(mobile);
		};

		// Check for Mac
		const checkMac = () => {
			setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
		};

		checkMobile();
		checkMac();

		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return { isMobile, isMac };
}
