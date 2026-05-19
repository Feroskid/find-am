import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { track } from "@/lib/track";

const LOCALE_MAP: Record<Lang, string> = {
  en: "en-NG",
  yo: "yo-NG",
  ig: "ig-NG",
  ha: "ha-NG",
  pcm: "en-NG",
};

interface Props {
  onResult: (text: string) => void;
  className?: string;
}

export function VoiceSearchButton({ onResult, className }: Props) {
  const { lang, t } = useI18n();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    setSupported(!!SR);
  }, []);

  const start = () => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(t.voiceUnsupported);
      return;
    }
    const rec = new SR();
    rec.lang = LOCALE_MAP[lang] || "en-NG";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? "";
      if (text) {
        track({ action_type: "voice_search", search_query: text });
        onResult(text);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  };

  return (
    <button
      type="button"
      aria-label={t.voice}
      title={supported ? (listening ? t.voiceListening : t.voice) : t.voiceUnsupported}
      onClick={listening ? stop : start}
      className={
        className ??
        "p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
      }
    >
      {listening ? (
        <MicOff className="h-4 w-4 text-destructive animate-pulse" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
