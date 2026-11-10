export type Theme = "light" | "dark";

const KEY = "tht-theme";

export function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#1a1410" : "#fff8ef");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}
