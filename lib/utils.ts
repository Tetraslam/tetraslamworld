import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSparkles(event: MouseEvent, element: HTMLElement) {
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.style.left = `${event.clientX - element.offsetLeft}px`;
  sparkle.style.top = `${event.clientY - element.offsetTop}px`;
  element.appendChild(sparkle);
  
  setTimeout(() => sparkle.remove(), 1000);
}

type AnyFunction = (...args: unknown[]) => unknown;

export function debounce<T extends AnyFunction>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
} 