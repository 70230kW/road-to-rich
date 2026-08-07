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
