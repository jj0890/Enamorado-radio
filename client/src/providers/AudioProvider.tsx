import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { audioController } from "@/lib/audioController";

type State = {
  status: "idle" | "loading" | "playing" | "paused" | "error";
  src?: string;
  title?: string;
  artist?: string;
  artwork?: string;
  isLive?: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
};

type Actions = {
  play: (src: string, meta?: Partial<State>) => Promise<void>;
  pause: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  seek: (t: number) => void;
};

const Ctx = createContext<{ state: State; actions: Actions } | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  console.log('🎵 AudioProvider initializing...');
  
  const [state, dispatch] = useReducer(
    (s: State, a: Partial<State>) => ({ ...s, ...a }),
    {
      status: "idle",
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
    }
  );
  
  console.log('🎵 AudioProvider state initialized:', state);

  useEffect(() => {
    const off1 = audioController.on("play", () => dispatch({ status: "playing" }));
    const off2 = audioController.on("pause", () => dispatch({ status: "paused" }));
    const off3 = audioController.on("timeupdate", () =>
      dispatch({
        currentTime: audioController.el.currentTime,
        duration: audioController.el.duration || 0,
      })
    );
    const off4 = audioController.on("error", () => dispatch({ status: "error" }));
    const off5 = audioController.on("loadedmetadata", () =>
      dispatch({ duration: audioController.el.duration || 0 })
    );

    return () => {
      off1();
      off2();
      off3();
      off4();
      off5();
    };
  }, []);

  const actions: Actions = useMemo(
    () => ({
      async play(src, meta) {
        if (meta) dispatch(meta);
        dispatch({ status: "loading", src });
        try {
          await audioController.play(src);
        } catch (error) {
          dispatch({ status: "error" });
          throw error;
        }
      },
      pause() {
        audioController.pause();
      },
      toggle() {
        audioController.toggle();
      },
      setVolume(v) {
        audioController.setVolume(v);
        dispatch({ volume: v });
      },
      seek(t) {
        audioController.seek(t);
      },
    }),
    []
  );

  console.log('🎵 AudioProvider rendering with state:', state.status);
  return <Ctx.Provider value={{ state, actions }}>{children}</Ctx.Provider>;
}

export const useAudio = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
};
