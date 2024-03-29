import { MantineThemeColorsOverride } from "@mantine/core";
import { TalentFilterMode } from "./loadout-filter";
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
  const colors: {[key: string]: Color[]} = {
    dark: createShades(
      { r: 23, g: 28, b: 34 }, 7,
      { r: 175, g: 191, b: 190 }, 0,
    ),
    primary: createShades(
      { r: 118, g: 153, b: 147 }
    ),
    highValue: createShades(
      { r: 100, g: 175, b: 125 }
    ),
    horde: createShades(
      { r: 175, g: 55, b: 0 }
    ),
    caution: createShades(
      { r: 75, g: 20, b: 20 }
    ),
    highlight: createShades(
      { r: 24, g: 100, b: 171 }, 9,
      { r: 51, g: 154, b: 240 }, 5,
    ),
    alliance: createShades(
      { r: 0, g: 112, b: 221 }
    ),
  };
  for (let key in CLASS_COLORS) {
    colors[key] = createShades(CLASS_COLORS[key]);
  }

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
  const highColor = globalColors.highValue[9]; 
  return lerpColors(lowColor, highColor, progress);
}

export function getUsageColor(usage: number) {
    const lowColor = {
      r: 175,
      g: 55,
      b: 0,
    };
    const highColor = lerpColors(lowColor, globalColors.highValue[9], usage);
    return lerpColors(lowColor, highColor, usage);
}

export function getTalentColors(usage: number, filterMode: TalentFilterMode) {
  let borderStrength = 0.3;
  let bgStrength = 0.2;
  let usageColor = getUsageColor(usage);
  if (filterMode == TalentFilterMode.RankZero) {
    usageColor = {
      r: 200,
      g: 50,
      b: 50,
    }
    borderStrength = 0.5;
    bgStrength = 0.3;

  } else if (filterMode != TalentFilterMode.None) {
    usageColor = {
      r: 255,
      g: 180,
      b: 50,
    };
    borderStrength = 0.5;
    bgStrength = 0.3;
  }
  const borderColor = lerpColors(usageColor, globalColors.dark[4], 1.0 - borderStrength);
  const bgColor = lerpColors(usageColor, globalColors.dark[5], 1.0 - bgStrength);
  const borderHoverColor = lerpColors(usageColor, globalColors.dark[4], 0.8 - borderStrength);
  const bgHoverColor = lerpColors(usageColor, globalColors.dark[5], 0.8 - bgStrength);

  return {
    borderColor,
    bgColor,
    borderHoverColor,
    bgHoverColor,
    color: usageColor,
  };
}
