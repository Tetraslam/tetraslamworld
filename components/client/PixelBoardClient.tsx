'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the PixelBoard component with SSR disabled
const PixelBoard = dynamic(() => import('@/components/ui/pixel-board'), {
  ssr: false,
  loading: () => <p className="text-muted-foreground">Loading board…</p>,
});

export default function PixelBoardClient() {
  return <PixelBoard />;
} 