export function WeatherGlyph({ code }: { code: string }) {
  const common = "h-8 w-8 text-lantern-deep dark:text-amberglow";
  if (code === "clear" || code === "mainlyClear") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
        <circle cx="16" cy="16" r="6" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.5 6.5l3 3M22.5 22.5l3 3M25.5 6.5l-3 3M9.5 22.5l-3 3" />
        </g>
      </svg>
    );
  }
  if (code === "rain" || code === "drizzle" || code === "thunder" || code === "snow") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
        <path d="M10 18h12a5 5 0 0 0 .4-10 7 7 0 0 0-13.4 2A4.5 4.5 0 0 0 10 18z" fill="currentColor" />
        <path d="M12 21l-2 5M18 21l-2 5M24 21l-2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
      <path d="M9 20h14a5 5 0 0 0 .3-10A7 7 0 0 0 10 12a4 4 0 0 0-1 8z" fill="currentColor" />
    </svg>
  );
}
