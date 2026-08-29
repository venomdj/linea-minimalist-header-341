import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border border-border bg-surface-2 px-1",
        "transition-colors duration-500 ease-expo-out hover:border-foreground/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Track glyphs — faint, indicate which side is which */}
      <Sun
        size={12}
        strokeWidth={2}
        className={cn(
          "absolute left-[8px] text-muted-foreground transition-opacity duration-300",
          isDark ? "opacity-0" : "opacity-50",
        )}
      />
      <Moon
        size={12}
        strokeWidth={2}
        className={cn(
          "absolute right-[8px] text-muted-foreground transition-opacity duration-300",
          isDark ? "opacity-50" : "opacity-0",
        )}
      />

      {/* Sliding thumb */}
      <span
        className={cn(
          "relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-card",
          "transition-transform duration-500 ease-expo-out",
          isDark ? "translate-x-7" : "translate-x-0",
        )}
      >
        {/* Sun — visible in light mode, rotates & shrinks away */}
        <Sun
          size={14}
          strokeWidth={2.25}
          className={cn(
            "absolute text-accent transition-all duration-500 ease-expo-out",
            isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        {/* Moon — visible in dark mode, rotates & grows in */}
        <Moon
          size={13}
          strokeWidth={2.25}
          className={cn(
            "absolute text-accent transition-all duration-500 ease-expo-out",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
          )}
        />
      </span>
    </button>
  );
};

export default ThemeToggle;
