import { useCallback, useEffect, useRef } from "react";

import {
  useOverlayContext,
  type OverlayConfig,
} from "../components/containers/OverlayProvider";

function useCreateOverlay<TState>(state: TState) {
  const { createOverlay, updateState } = useOverlayContext();
  const overlayIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    overlayIdsRef.current.forEach((id) => {
      updateState(id, state);
    });
  }, [state, updateState]);

  return useCallback(
    (config: OverlayConfig<TState>) => {
      const id = createOverlay(config, state);
      overlayIdsRef.current.add(id);
      return id;
    },
    [createOverlay, state],
  );
}

export default useCreateOverlay;
