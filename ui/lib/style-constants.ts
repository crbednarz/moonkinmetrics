import {lerp} from "./util";

interface Color {
  r: number,
  g: number,
  b: number,
}

export const CLASS_COLORS: {[key: string]: Color} = {
  "death-knight": {r: 196, g: 30, b: 58},
  "demon-hunter": {r: 163, g: 48, b: 201},
  "druid": {r: 255, g: 124, b: 10},
  "evoker": {r: 51, g: 147, b: 127},
  "hunter": {r: 170, g: 211, b: 114},
  "mage": {r: 63, g: 199, b: 235},
  "monk": {r: 0, g: 255, b: 152},
  "paladin": {r: 244, g: 140, b: 186},
  "priest": {r: 255, g: 255, b: 255},
  "rogue": {r: 255, g: 244, b: 104},
  "shaman": {r: 0, g: 112, b: 221},
  "warlock": {r: 135, g: 136, b: 238},
  "warrior": {r: 198, g: 155, b: 109},
};

export function createThemeColors({r, g, b}: Color) {
  let colors: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const delta = i / 10.0;
    colors.push(`rgb(${lerp(255, r, delta)}, ${lerp(255, g, delta)}, ${lerp(255, b, delta)})`);
  }
  return colors;
}
