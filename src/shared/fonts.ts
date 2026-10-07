import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// All fonts are bundled in public/fonts so renders never need network access.
export const fonts = {
  inter: "Inter",
  anton: "Anton",
  spaceGrotesk: "Space Grotesk",
  fraunces: "Fraunces",
} as const;

loadFont({
  family: fonts.inter,
  url: staticFile("fonts/Inter-Variable.woff2"),
  weight: "100 900",
});
loadFont({
  family: fonts.anton,
  url: staticFile("fonts/Anton-Regular.woff2"),
  weight: "400",
});
loadFont({
  family: fonts.spaceGrotesk,
  url: staticFile("fonts/SpaceGrotesk-Variable.woff2"),
  weight: "300 700",
});
loadFont({
  family: fonts.fraunces,
  url: staticFile("fonts/Fraunces-Variable.woff2"),
  weight: "100 900",
});

export const typewriterFont = "Special Elite";
loadFont({
  family: typewriterFont,
  url: staticFile("fonts/SpecialElite-Regular.woff2"),
  weight: "400",
});
