"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";

/**
 * Normalized pointer position in [-1, 1] on each axis, updated on every
 * mousemove but stored in a ref so consumers can read it inside useFrame()
 * without triggering React re-renders.
 */
export type PointerState = { x: number; y: number };

const PointerContext = createContext<MutableRefObject<PointerState> | null>(
  null
);

export function PointerProvider({ children }: { children: ReactNode }) {
  const pointer = useRef<PointerState>({ x: 0, y: 0 });

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  return (
    <PointerContext.Provider value={pointer}>
      {children}
    </PointerContext.Provider>
  );
}

export function usePointer() {
  const ctx = useContext(PointerContext);
  if (!ctx) {
    throw new Error("usePointer must be used within a PointerProvider");
  }
  return ctx;
}
