import {lerp} from "./util";

export const CLASS_COLORS: {[key: string]: string[]} = {
  "death-knight": createColors(196, 30, 58),
  "demon-hunter": createColors(163, 48, 201),
  "druid": createColors(255, 124, 10),
  "evoker": createColors(51, 147, 127),
  "hunter": createColors(170, 211, 114),
  "mage": createColors(63, 199, 235),
  "monk": createColors(0, 255, 152),
  "paladin": createColors(244, 140, 186),
  "priest": createColors(255, 255, 255),
  "rogue": createColors(255, 244, 104),
  "shaman": createColors(0, 112, 221),
  "warlock": createColors(135, 136, 238),
  "warrior": createColors(198, 155, 109),
};

function createColors(r: number, g: number, b: number) {
  let colors: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const delta = i / 10.0;
    colors.push(`rgb(${lerp(255, r, delta)}, ${lerp(255, g, delta)}, ${lerp(255, b, delta)})`);
  }
  return colors;
}
