export type ThemeMode = "light" | "dark";

export const themeKey = "smart.theme";

export function loadTheme(): ThemeMode {
  return localStorage.getItem(themeKey) === "dark" ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(themeKey, theme);
}
