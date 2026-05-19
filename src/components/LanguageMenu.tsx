import { useState } from "react";
import { Globe, Check } from "lucide-react";

const LANGS = ["English", "Yoruba", "Igbo", "Hausa", "Pidgin"];

export function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("English");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-soft text-primary px-3 py-1.5 rounded-full hover:opacity-90"
      >
        <Globe className="h-3.5 w-3.5" /> {lang}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul className="absolute right-0 mt-2 z-20 w-36 rounded-lg border border-border bg-card shadow-lg py-1 text-sm">
            {LANGS.map((l) => (
              <li key={l}>
                <button
                  onClick={() => { setLang(l); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-muted text-left"
                >
                  {l}
                  {l === lang && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
