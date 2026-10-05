import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function useInstallApp() {
  const [state, setState] = useState({ ready: false, canPrompt: false, isIOS: false, installed: false });
  useEffect(() => {
    const update = () => {
      const ua = navigator.userAgent;
      const isIOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
      const installed =
        window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
      setState({ ready: true, canPrompt: !!deferred, isIOS, installed });
    };
    update();
    listeners.add(update);
    return () => void listeners.delete(update);
  }, []);
  const promptInstall = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null;
    listeners.forEach((l) => l());
    return true;
  };
  return { ...state, promptInstall };
}
