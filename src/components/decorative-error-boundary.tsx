"use client";

import { Component, type ReactNode } from "react";

/**
 * Error boundary for purely decorative components (canvas backgrounds,
 * WebGL flourishes). If they crash (e.g. headless browsers without WebGL),
 * render nothing instead of taking down the whole page.
 */
export class DecorativeErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
