import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "./../../utilities";

const MAP_POSITION_CLASS = {
  center: "!grid place-items-center",
  right: "justify-end",
  left: "justify-start",
} as const;

type Position = keyof typeof MAP_POSITION_CLASS;

type OverlayProps<TState> = {
  state: TState;
  close: () => void;
};

export type OverlayConfig<TState = unknown> = {
  component: React.ComponentType<OverlayProps<TState>>;
  position?: Position;
};

type OverlayInstance<TState = any> = {
  id: string;
  component: React.ComponentType<OverlayProps<TState>>;
  state: TState;
  position: Position;
};

type OverlayContextType = {
  createOverlay: <TState>(
    config: OverlayConfig<TState>,
    state: TState,
  ) => string;
  closeOverlay: (id: string) => void;
  updateState: <TState>(id: string, state: TState) => void;
};

const OverlayContext = createContext<OverlayContextType | null>(null);

export const useOverlayContext = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlayContext must be used within OverlayProvider");
  }
  return context;
};

function areStatesEqual<TState>(prev: TState, next: TState): boolean {
  if (prev === next) return true;

  if (prev == null || next == null) return prev === next;

  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return false;
    return prev.every((val, index) => areStatesEqual(val, next[index]));
  }

  if (typeof prev === "object" && typeof next === "object") {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);

    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every(
      (key) =>
        nextKeys.includes(key) &&
        areStatesEqual((prev as any)[key], (next as any)[key]),
    );
  }

  return prev === next;
}

const getAnimationProps = (position: Position) => {
  const motionProps = {
    left: {
      initial: { x: "-20%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-20%", opacity: 0 },
    },
    right: {
      initial: { x: "20%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "20%", opacity: 0 },
    },
    center: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
  };

  return motionProps[position];
};

export const OverlayProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const overlaysRef = useRef<Map<string, OverlayInstance>>(new Map());
  const [overlaysKey, setOverlaysKey] = useState(0);

  const createOverlay = useCallback(
    <TState,>(config: OverlayConfig<TState>, state: TState): string => {
      const id = `overlay-${Date.now()}-${crypto.randomUUID()}`;
      const instance: OverlayInstance<TState> = {
        id,
        component: config.component,
        state,
        position: config.position || "center",
      };

      overlaysRef.current.set(id, instance);
      setOverlaysKey((prev) => prev + 1);
      return id;
    },
    [],
  );

  const closeOverlay = useCallback((id: string) => {
    if (overlaysRef.current.has(id)) {
      overlaysRef.current.delete(id);
      setOverlaysKey((prev) => prev + 1);
    }
  }, []);

  const updateState = useCallback(<TState,>(id: string, state: TState) => {
    const overlay = overlaysRef.current.get(id);
    if (overlay && !areStatesEqual(overlay.state, state)) {
      overlaysRef.current.set(id, { ...overlay, state });
      setOverlaysKey((prev) => prev + 1);
    }
  }, []);

  const overlayContextValue = useMemo(
    () => ({
      createOverlay,
      closeOverlay,
      updateState,
    }),
    [createOverlay, closeOverlay, updateState],
  );

  const overlayList = useMemo(
    () => Array.from(overlaysRef.current.values()),
    [overlaysKey],
  );

  return (
    <OverlayContext.Provider value={overlayContextValue}>
      {children}
      <AnimatePresence>
        {overlayList.map((overlay, index) => {
          const OverlayComponent = overlay.component;
          const motionProps = getAnimationProps(overlay.position);

          return (
            <Dialog
              key={overlay.id}
              open={true}
              onClose={() => overlayContextValue.closeOverlay(overlay.id)}
            >
              <motion.div
                className={cn(
                  "fixed inset-0 grid items-center overflow-y-auto bg-black/50",
                  MAP_POSITION_CLASS[overlay.position],
                )}
                style={{ zIndex: 1000 + index }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DialogPanel>
                  <motion.div
                    {...motionProps}
                    transition={{ type: "spring", duration: 0.3, bounce: 0.25 }}
                  >
                    <OverlayComponent
                      state={overlay.state}
                      close={() => overlayContextValue.closeOverlay(overlay.id)}
                    />
                  </motion.div>
                </DialogPanel>
              </motion.div>
            </Dialog>
          );
        })}
      </AnimatePresence>
    </OverlayContext.Provider>
  );
};

export default OverlayProvider;
