import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
  const { lang } = useLanguage();

  return (
    <footer className="w-full text-center mt-8 py-4 bg-white/70 backdrop-blur-md shadow-[0_-1px_0_#e5e7eb] text-gray-800 text-sm">
      © {new Date().getFullYear()} Arsenijus Valentukevičius.{" "}
      {lang === "lt" ? "Visos teisės saugomos." : "All rights reserved."}
    </footer>
  );
};

export default Footer;
