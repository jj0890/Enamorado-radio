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
    const off6 = audioController.on("ended", () => dispatch({ status: "idle" }));

    return () => {
      off1();
      off2();
      off3();
      off4();
      off5();
      off6();
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

  return <Ctx.Provider value={{ state, actions }}>{children}</Ctx.Provider>;
}

export const useAudio = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
};
