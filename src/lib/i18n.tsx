import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "yo" | "ig" | "ha" | "pcm";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
  { code: "pcm", label: "Pidgin" },
];

type Dict = {
  search: string;
  jobs: string;
  tagline: string;
  searchPlaceholder: string;
  searchShort: string;
  popular: string;
  trending: string;
  voice: string;
  go: string;
  about: string;
  results: string;
  page: string;
  of: string;
  noResults: string;
  loadError: string;
  posted: string;
  footerAbout: string;
  advertising: string;
  business: string;
  privacy: string;
  terms: string;
  settings: string;
  voiceListening: string;
  voiceUnsupported: string;
};

const dictionaries: Record<Lang, Dict> = {
  en: {
    search: "Search",
    jobs: "Jobs",
    tagline: "you need work?… try Find-Am",
    searchPlaceholder: "Search jobs across Nigeria…",
    searchShort: "Search jobs…",
    popular: "Popular",
    trending: "Trending Job Searches",
    voice: "Search by voice",
    go: "Go",
    about: "About",
    results: "results",
    page: "page",
    of: "of",
    noResults: "No jobs found for",
    loadError: "Couldn't load results",
    posted: "Posted",
    footerAbout: "About",
    advertising: "Advertising",
    business: "Business",
    privacy: "Privacy",
    terms: "Terms",
    settings: "Settings",
    voiceListening: "Listening…",
    voiceUnsupported: "Voice search not supported on this browser",
  },
  yo: {
    search: "Wá",
    jobs: "Iṣẹ́",
    tagline: "Ṣé o nílò iṣẹ́?… gbìyànjú Find-Am",
    searchPlaceholder: "Wá iṣẹ́ jákèjádò Nàìjíríà…",
    searchShort: "Wá iṣẹ́…",
    popular: "Gbajúmọ̀",
    trending: "Iṣẹ́ tó ń gbajúmọ̀",
    voice: "Wá pẹ̀lú ohùn",
    go: "Lọ",
    about: "Nípa",
    results: "àbájáde",
    page: "ojú-ìwé",
    of: "nínú",
    noResults: "Kò sí iṣẹ́ kankan fún",
    loadError: "Kò ṣeé ṣe láti gba àbájáde",
    posted: "A fi sí",
    footerAbout: "Nípa wa",
    advertising: "Ìpolówó",
    business: "Òwò",
    privacy: "Àṣírí",
    terms: "Òfin",
    settings: "Ètò",
    voiceListening: "Ń gbọ́…",
    voiceUnsupported: "Ìwá ohùn kò ṣiṣẹ́ lórí ẹ̀rọ yìí",
  },
  ig: {
    search: "Chọọ",
    jobs: "Ọrụ",
    tagline: "Ị chọrọ ọrụ?… nwaa Find-Am",
    searchPlaceholder: "Chọọ ọrụ na Nigeria niile…",
    searchShort: "Chọọ ọrụ…",
    popular: "Ewu ewu",
    trending: "Ọrụ ndị a na-achọkarị",
    voice: "Jiri olu chọọ",
    go: "Gaa",
    about: "Banyere",
    results: "nsonaazụ",
    page: "ibe",
    of: "n'ime",
    noResults: "Achọtaghị ọrụ maka",
    loadError: "Enweghị ike ibubata nsonaazụ",
    posted: "Edebere",
    footerAbout: "Banyere anyị",
    advertising: "Mgbasa ozi",
    business: "Azụmahịa",
    privacy: "Nzuzo",
    terms: "Usoro",
    settings: "Ntọala",
    voiceListening: "Na-ege ntị…",
    voiceUnsupported: "Nchọchọ olu adịghị arụ ọrụ ebe a",
  },
  ha: {
    search: "Bincika",
    jobs: "Aikace-aikace",
    tagline: "Kana son aiki?… gwada Find-Am",
    searchPlaceholder: "Bincika aiki a faɗin Najeriya…",
    searchShort: "Bincika aiki…",
    popular: "Sananne",
    trending: "Aikace-aikace masu tashi",
    voice: "Bincika da murya",
    go: "Tafi",
    about: "Game da",
    results: "sakamako",
    page: "shafi",
    of: "daga",
    noResults: "Babu aikin da aka samu na",
    loadError: "An kasa ɗora sakamako",
    posted: "An wallafa",
    footerAbout: "Game da mu",
    advertising: "Talla",
    business: "Kasuwanci",
    privacy: "Sirri",
    terms: "Sharuɗɗa",
    settings: "Saituna",
    voiceListening: "Ana saurara…",
    voiceUnsupported: "Bincike na murya ba ya aiki a nan",
  },
  pcm: {
    search: "Find",
    jobs: "Work",
    tagline: "You need work?… try Find-Am",
    searchPlaceholder: "Find work for Naija…",
    searchShort: "Find work…",
    popular: "Wetin dey hot",
    trending: "Work wey people dey find",
    voice: "Find with voice",
    go: "Go",
    about: "About",
    results: "results",
    page: "page",
    of: "out of",
    noResults: "No work for",
    loadError: "We no fit load results",
    posted: "Dem post am",
    footerAbout: "About us",
    advertising: "Advert",
    business: "Business",
    privacy: "Privacy",
    terms: "Terms",
    settings: "Settings",
    voiceListening: "I dey listen…",
    voiceUnsupported: "Voice search no dey work for dis browser",
  },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("findam:lang") as Lang | null;
      if (stored && dictionaries[stored]) setLangState(stored);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("findam:lang", l);
    } catch {}
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: dictionaries[lang] }}>{children}</Ctx.Provider>
  );
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}
