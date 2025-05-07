import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LanguageContextType {
  lang: string;
  setLang: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "lt" || savedLang === "en") {
      setLang(savedLang);
    } else {
      setLang("en");
    }
  }, []);

  useEffect(() => {
    if (lang) {
      localStorage.setItem("lang", lang);
    }
  }, [lang]);

  if (!lang) return null; // kol neįkeltas lang – nieko nerenderinam

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
