import {MantineThemeColorsOverride} from "@mantine/core";
import { lerp } from "./util";

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

export function createShades(
  color: Color,
  colorIndex: number = 9,
  baseColor?: Color,
  baseIndex: number = 0,
): Color[] {
  const colors: Color[] = [];

  if (!baseColor) {
    baseColor = {
      r: (255 - color.r) * 0.95 + color.r,
      g: (255 - color.g) * 0.95 + color.g,
      b: (255 - color.b) * 0.95 + color.b,
    }
  }

  if (colorIndex <= baseIndex) {
    throw new Error('colorIndex must be greater than baseIndex');
  }

  const colorStep = {
    r: (color.r - baseColor.r) / (colorIndex - baseIndex),
    g: (color.g - baseColor.g) / (colorIndex - baseIndex),
    b: (color.b - baseColor.b) / (colorIndex - baseIndex),
  };

  const indexColor = {
    r: baseColor.r - colorStep.r * baseIndex,
    g: baseColor.g - colorStep.g * baseIndex,
    b: baseColor.b - colorStep.b * baseIndex,
  };
  for (let i = 0; i < 10; i++) {
    colors.push({...indexColor});
    indexColor.r += colorStep.r;
    indexColor.g += colorStep.g;
    indexColor.b += colorStep.b;
  }
  return colors;
} 

export function createThemeColors(
  color: Color,
  colorIndex: number = 9,
  baseColor?: Color,
  baseIndex: number = 0,
): string[] {
  const colors = createShades(color, colorIndex, baseColor, baseIndex);
  return colors.map(color => `rgb(${color.r}, ${color.g}, ${color.b})`);
}

export const globalColors = (() => {
  const colors: {[key: string]: Color[]} = {};
  for (let key in CLASS_COLORS) {
    colors[key] = createShades(CLASS_COLORS[key]);
  }

  colors['dark'] = createShades(
    {r: 23, g: 28, b: 34}, 7,
    {r: 175, g: 191, b: 190}, 0,
  );

  colors['primary'] = createShades(
    {r: 118, g: 153, b: 147}
  );

  colors['hightlight'] = createShades(
      {r: 100, g: 175, b: 125}
  );

  return colors;
})();

export function globalThemeColors(): MantineThemeColorsOverride {
  const colors = globalColors;
  const themeColors: {[key: string]: string[]} = {};
  for (let key in colors) {
    themeColors[key] = colors[key].map(color => `rgb(${color.r}, ${color.g}, ${color.b})`);
  }
  return themeColors;
}

export function lerpColors(
  color1: Color,
  color2: Color,
  delta: number,
): Color {
  return {
    r: lerp(color1.r, color2.r, delta),
    g: lerp(color1.g, color2.g, delta),
    b: lerp(color1.b, color2.b, delta),
  };
}

export function colorToStyle(color: Color, alpha: number = 1.0): string {
  if (alpha < 1) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function getProgressColor(progress: number) {
  const lowColor = globalColors['dark'][5];
  const highColor = globalColors['hightlight'][9]; 
  return lerpColors(lowColor, highColor, progress);
}

