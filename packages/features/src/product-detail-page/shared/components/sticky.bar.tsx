"use client";

import throttle from "lodash/throttle";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn } from "@nimara/ui/lib/utils";

/** Scroll threshold in pixels before showing the sticky bar */
const SCROLL_THRESHOLD = 500;

function subscribeToScroll(callback: () => void) {
	const handler = throttle(callback, 100);

	window.addEventListener("scroll", handler, { passive: true });

	return () => {
		handler.cancel();
		window.removeEventListener("scroll", handler);
	};
}

function getScrollSnapshot() {
	return window.scrollY > SCROLL_THRESHOLD;
}

function getServerScrollSnapshot() {
	return false;
}

interface StickyBarProps {
	children?: ReactNode;
	price: string;
	productName: string;
	show?: boolean;
}

export function StickyBar({
	productName,
	price,
	show = true,
	children,
}: StickyBarProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const scrolledPastThreshold = useSyncExternalStore(
		subscribeToScroll,
		getScrollSnapshot,
		getServerScrollSnapshot,
	);

	const isVisible = show && scrolledPastThreshold;

	if (!mounted) {
		return null;
	}

	return createPortal(
		<div
			className={cn(
				"fixed bottom-0 left-0 right-0 z-[9999] border-t bg-background transition-transform duration-300 md:hidden",
				isVisible ? "translate-y-0" : "translate-y-full",
			)}
		>
			<div className="mx-auto flex max-w-7xl flex-row items-center justify-between gap-4 px-4 py-3">
				<div className="min-w-0">
					<p>{productName}</p>
					<p className="line-clamp-2 text-sm text-muted-foreground">{price}</p>
				</div>

				{children && <div className="w-1/2">{children}</div>}
			</div>
		</div>,
		document.body,
	);
}
