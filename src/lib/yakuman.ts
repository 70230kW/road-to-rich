export interface YakumanDef {
  id: string;
  name: string;
  description: string;
  isDouble: boolean;
}

export const YAKUMAN_LIST: YakumanDef[] = [
  { id: 'tenho', name: '天和', description: '親の配牌の時点で既に和了した場合に成立する。', isDouble: false },
  {
    id: 'chiho',
    name: '地和',
    description: '子が配牌時点で聴牌し、誰の鳴きも入らないで第1ツモで和了した場合に成立する。',
    isDouble: false,
  },
  {
    id: 'daisangen',
    name: '大三元',
    description: '白發中の三種類の刻子もしくは槓子があった場合に成立する。',
    isDouble: false,
  },
  { id: 'suuankou', name: '四暗刻', description: '暗刻を4つ作って和了した場合に成立する。', isDouble: false },
  { id: 'tsuiisou', name: '字一色', description: '字牌だけを使って和了した場合に成立する。', isDouble: false },
  {
    id: 'ryuuiisou',
    name: '緑一色',
    description: '二索、三索、四索、六索、八索、發だけを使って和了した場合に成立する。',
    isDouble: false,
  },
  { id: 'chinroutou', name: '清老頭', description: '老頭牌だけを使って和了した場合に成立する。', isDouble: false },
  {
    id: 'kokushi',
    name: '国士無双',
    description: '么九牌13種すべて1枚ずつ揃え、そのうちのどれか1種を雀頭として和了した場合に成立する。',
    isDouble: false,
  },
  {
    id: 'shousuushii',
    name: '小四喜',
    description: '東南西北のうち3種を刻子・槓子にし、残りの1種を雀頭にして和了した場合に成立する。',
    isDouble: false,
  },
  { id: 'suukantsu', name: '四槓子', description: '槓子を4つ作って和了した場合に成立する。', isDouble: false },
  {
    id: 'chuuren',
    name: '九蓮宝燈',
    description: '萬子、索子、筒子のどれか1種だけで「1112345678999+X」の形を作って和了した場合に成立する。',
    isDouble: false,
  },
  {
    id: 'suuankou-tanki',
    name: '四暗刻単騎',
    description: '四暗刻を単騎待ちで和了した場合に成立する。',
    isDouble: true,
  },
  {
    id: 'kokushi-13',
    name: '国士無双十三面待ち',
    description: '国士無双を十三面待ちで和了した場合に成立する。',
    isDouble: true,
  },
  {
    id: 'junsei-chuuren',
    name: '純正九蓮宝燈',
    description: '九連宝灯を九面待ちで和了した場合に成立する。',
    isDouble: true,
  },
  {
    id: 'daisuushii',
    name: '大四喜',
    description: '東南西北の4種を刻子・槓子にして和了した場合に成立する。',
    isDouble: true,
  },
];

export function findYakuman(id: string): YakumanDef | undefined {
  return YAKUMAN_LIST.find((y) => y.id === id);
}

/**
 * Which yakuman genuinely cannot occur on the same win as which others (compound/複合).
 * Based on hand-shape and tile-composition constraints:
 *   - 国士無双 has no sets at all, so it can never share a hand with anything that
 *     requires triplets/sequences/kans (only 天和/地和 are timing-based, not shape-based,
 *     so they're compatible with it).
 *   - 九蓮宝燈 requires one suit's full 1-9 run, so it excludes honor-only, terminal-only,
 *     green-only, and wind/dragon-triplet yakuman, plus 国士無双.
 *   - 大三元 (3 dragon sets) and 小四喜/大四喜 (3-4 wind sets) can't coexist — a hand only
 *     has 4 sets total.
 *   - Tile-type-exclusive yakuman (字一色/緑一色/清老頭) are mutually exclusive with each
 *     other, since their required tiles don't overlap.
 *   - Each yakuman's "regular" and its own double-yakuman upgrade (四暗刻/四暗刻単騎,
 *     国士無双/国士無双十三面待ち, 九蓮宝燈/純正九蓮宝燈) describe alternate wait shapes for
 *     the same win, so only one of each pair applies at a time.
 *   - 小四喜/大四喜 are likewise alternate forms (3 triplets+pair vs 4 triplets) — never both.
 *   - 天和/地和 depend on being dealer vs non-dealer, so never both.
 */
const INCOMPATIBLE: Record<string, string[]> = {
  tenho: ['chiho'],
  chiho: ['tenho'],
  daisangen: ['kokushi', 'kokushi-13', 'chuuren', 'junsei-chuuren', 'ryuuiisou', 'chinroutou', 'shousuushii', 'daisuushii'],
  suuankou: ['suuankou-tanki', 'kokushi', 'kokushi-13', 'chuuren', 'junsei-chuuren'],
  'suuankou-tanki': ['suuankou', 'kokushi', 'kokushi-13', 'chuuren', 'junsei-chuuren'],
  tsuiisou: ['kokushi', 'kokushi-13', 'chuuren', 'junsei-chuuren', 'ryuuiisou', 'chinroutou'],
  ryuuiisou: [
    'kokushi',
    'kokushi-13',
    'chuuren',
    'junsei-chuuren',
    'tsuiisou',
    'chinroutou',
    'daisangen',
    'shousuushii',
    'daisuushii',
  ],
  chinroutou: [
    'kokushi',
    'kokushi-13',
    'chuuren',
    'junsei-chuuren',
    'tsuiisou',
    'ryuuiisou',
    'daisangen',
    'shousuushii',
    'daisuushii',
  ],
  kokushi: [
    'kokushi-13',
    'daisangen',
    'suuankou',
    'suuankou-tanki',
    'tsuiisou',
    'ryuuiisou',
    'chinroutou',
    'shousuushii',
    'daisuushii',
    'suukantsu',
    'chuuren',
    'junsei-chuuren',
  ],
  'kokushi-13': [
    'kokushi',
    'daisangen',
    'suuankou',
    'suuankou-tanki',
    'tsuiisou',
    'ryuuiisou',
    'chinroutou',
    'shousuushii',
    'daisuushii',
    'suukantsu',
    'chuuren',
    'junsei-chuuren',
  ],
  shousuushii: ['daisuushii', 'kokushi', 'kokushi-13', 'chuuren', 'junsei-chuuren', 'ryuuiisou', 'chinroutou', 'daisangen'],
  daisuushii: ['shousuushii', 'kokushi', 'kokushi-13', 'chuuren', 'junsei-chuuren', 'ryuuiisou', 'chinroutou', 'daisangen'],
  suukantsu: ['kokushi', 'kokushi-13', 'chuuren', 'junsei-chuuren'],
  chuuren: [
    'junsei-chuuren',
    'kokushi',
    'kokushi-13',
    'daisangen',
    'suuankou',
    'suuankou-tanki',
    'tsuiisou',
    'ryuuiisou',
    'chinroutou',
    'shousuushii',
    'daisuushii',
    'suukantsu',
  ],
  'junsei-chuuren': [
    'chuuren',
    'kokushi',
    'kokushi-13',
    'daisangen',
    'suuankou',
    'suuankou-tanki',
    'tsuiisou',
    'ryuuiisou',
    'chinroutou',
    'shousuushii',
    'daisuushii',
    'suukantsu',
  ],
};

export function areYakumanCompatible(idA: string, idB: string): boolean {
  if (idA === idB) return true;
  return !(INCOMPATIBLE[idA]?.includes(idB) || INCOMPATIBLE[idB]?.includes(idA));
}
