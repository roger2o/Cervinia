import { useState, useRef, useCallback, useEffect } from 'react';

export type PanelState = 'collapsed' | 'half' | 'full';

interface UseDragSheetOptions {
  /** Reset to this state when the dependency changes */
  resetDep?: unknown;
}

export function useDragSheet(options?: UseDragSheetOptions) {
  const [panelState, setPanelState] = useState<PanelState>('half');
  const handleRef = useRef<HTMLDivElement>(null);

  // Track drag state without re-renders
  const dragInfo = useRef<{
    active: boolean;
    startY: number;
    startState: PanelState;
  } | null>(null);
  const translateRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const [transitioning, setTransitioning] = useState(false);

  // Reset to half when route changes
  const resetDep = options?.resetDep;
  const prevResetDep = useRef(resetDep);
  useEffect(() => {
    if (prevResetDep.current !== resetDep) {
      prevResetDep.current = resetDep;
      setPanelState('half');
    }
  }, [resetDep]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only primary button
      if (e.button !== 0) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      dragInfo.current = {
        active: true,
        startY: e.clientY,
        startState: panelState,
      };
      translateRef.current = 0;
      setTransitioning(false);
    },
    [panelState],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragInfo.current?.active) return;
    const deltaY = e.clientY - dragInfo.current.startY;
    translateRef.current = deltaY;

    // Apply transform directly for 60fps
    if (panelRef.current) {
      panelRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragInfo.current?.active) return;

    const { startState } = dragInfo.current;
    const deltaY = translateRef.current;
    const threshold = 50;

    let nextState: PanelState = startState;

    if (deltaY < -threshold) {
      // Dragged up
      if (startState === 'collapsed') nextState = 'half';
      else if (startState === 'half') nextState = 'full';
    } else if (deltaY > threshold) {
      // Dragged down
      if (startState === 'full') nextState = 'half';
      else if (startState === 'half') nextState = 'collapsed';
    }

    // Clear transform and enable transition for snap
    if (panelRef.current) {
      panelRef.current.style.transform = '';
    }
    setTransitioning(true);
    setPanelState(nextState);

    dragInfo.current = null;
    translateRef.current = 0;

    // Remove transition class after animation
    setTimeout(() => setTransitioning(false), 300);
  }, []);

  // Tap header to expand from collapsed
  const onHeaderTap = useCallback(() => {
    if (panelState === 'collapsed') {
      setTransitioning(true);
      setPanelState('half');
      setTimeout(() => setTransitioning(false), 300);
    }
  }, [panelState]);

  return {
    panelState,
    setPanelState,
    handleRef,
    panelRef,
    transitioning,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onHeaderTap,
  };
}
