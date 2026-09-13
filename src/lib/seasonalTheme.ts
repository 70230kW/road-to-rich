/**
 * カレンダー上の季節（3-5月=春, 6-8月=夏, 9-11月=秋, 12-2月=冬）に応じて、
 * アプリのブランドアクセントカラー（Tailwind の cyan/blue スケールを上書きしているトークン）
 * を切り替える。実際の色値は index.html の同期スクリプトにも同じ内容を複製しており
 * （初回ペイント前にちらつきなく適用するため）、パレットを変更する場合は両方を更新すること。
 */

export type CalendarSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonPalette {
  /** Tailwind の 50〜950 の11段階スケール。cyan/blue 両トークンに同じ値を適用する。 */
  scale: Record<'50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950', string>;
  /** rgb(var(--accent-rgb-500) / 0.5) のような透過グロー表現用の "R G B" 文字列。 */
  rgb500: string;
  rgb400: string;
  rgb300: string;
}

export const SEASON_PALETTES: Record<CalendarSeason, SeasonPalette> = {
  spring: {
    scale: {
      '50': '#fdf2f8',
      '100': '#fce7f3',
      '200': '#fbcfe8',
      '300': '#f9a8d4',
      '400': '#f472b6',
      '500': '#ec4899',
      '600': '#db2777',
      '700': '#be185d',
      '800': '#9d174d',
      '900': '#831843',
      '950': '#500724',
    },
    rgb500: '236 72 153',
    rgb400: '244 114 182',
    rgb300: '249 168 212',
  },
  summer: {
    scale: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a',
      '950': '#172554',
    },
    rgb500: '59 130 246',
    rgb400: '96 165 250',
    rgb300: '147 197 253',
  },
  autumn: {
    scale: {
      '50': '#fff7ed',
      '100': '#ffedd5',
      '200': '#fed7aa',
      '300': '#fdba74',
      '400': '#fb923c',
      '500': '#f97316',
      '600': '#ea580c',
      '700': '#c2410c',
      '800': '#9a3412',
      '900': '#7c2d12',
      '950': '#431407',
    },
    rgb500: '249 115 22',
    rgb400: '251 146 60',
    rgb300: '253 186 116',
  },
  winter: {
    scale: {
      '50': '#ffffff',
      '100': '#f8fafc',
      '200': '#eef2f6',
      '300': '#dde5ec',
      '400': '#c3d0dc',
      '500': '#a8b8c7',
      '600': '#8a9bac',
      '700': '#6b7d8f',
      '800': '#4f5f70',
      '900': '#374553',
      '950': '#1f2933',
    },
    rgb500: '168 184 199',
    rgb400: '195 208 220',
    rgb300: '221 229 236',
  },
};

/** 月（1〜12）から季節を判定する。3,4,5=春 / 6,7,8=夏 / 9,10,11=秋 / 12,1,2=冬。 */
export function getCalendarSeason(date: Date = new Date()): CalendarSeason {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/** 現在の季節のパレットを cyan/blue トークンと accent-rgb-* に反映する。 */
export function applySeasonalTheme(season: CalendarSeason = getCalendarSeason()): void {
  const palette = SEASON_PALETTES[season];
  const root = document.documentElement.style;
  for (const [step, value] of Object.entries(palette.scale)) {
    root.setProperty(`--color-cyan-${step}`, value);
    root.setProperty(`--color-blue-${step}`, value);
  }
  root.setProperty('--accent-rgb-500', palette.rgb500);
  root.setProperty('--accent-rgb-400', palette.rgb400);
  root.setProperty('--accent-rgb-300', palette.rgb300);
}
