import { Sun, Moon } from "lucide-react";
import { useThemeContext } from "@/contexts/ThemeContext";

type Props = {
  className?: string;
};

const ThemeToggle = ({ className = "" }: Props) => {
  const { theme, toggleTheme } = useThemeContext();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={`relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors ${className}`}
    >
      <Sun
        size={20}
        strokeWidth={1.5}
        className={`absolute transition-all duration-200 ${
          isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-90"
        }`}
      />
      <Moon
        size={20}
        strokeWidth={1.5}
        className={`absolute transition-all duration-200 ${
          isDark ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100 rotate-0"
        }`}
      />
    </button>
  );
};

export default ThemeToggle;
