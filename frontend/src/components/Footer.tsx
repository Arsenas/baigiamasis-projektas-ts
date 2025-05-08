import { useLanguage } from "../context/LanguageContext";

type FooterProps = {
  className?: string;
};

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  const { lang } = useLanguage();

  return (
    <footer
      className={`w-full text-center py-4 bg-white/70 backdrop-blur-md shadow-[0_-1px_0_#e5e7eb] text-gray-800 text-sm ${className}`}
    >
      © {new Date().getFullYear()} Arsenijus Valentukevičius.{" "}
      {lang === "lt" ? "Visos teisės saugomos." : "All rights reserved."}
    </footer>
  );
};

export default Footer;
