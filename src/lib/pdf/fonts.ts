import { Font } from "@react-pdf/renderer";
import { ROBOTO_REGULAR, ROBOTO_MEDIUM, ROBOTO_BOLD } from "@/assets/fonts/roboto";

let registered = false;

/**
 * Register the embedded Roboto family (full Slovak diacritic support) with
 * @react-pdf/renderer. Fonts are embedded as base64 so no network/filesystem
 * access is required at render time on Vercel. Idempotent.
 */
export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: "Roboto",
    fonts: [
      { src: `data:font/ttf;base64,${ROBOTO_REGULAR}`, fontWeight: 400 },
      { src: `data:font/ttf;base64,${ROBOTO_MEDIUM}`, fontWeight: 500 },
      { src: `data:font/ttf;base64,${ROBOTO_BOLD}`, fontWeight: 700 },
    ],
  });
  // Prevent hyphenation splitting of Slovak words.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
