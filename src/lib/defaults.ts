import { defaultRankPoints } from './calc';
import type { Settings } from '../types';

export const defaultSettings: Settings = {
  playerCount: 4,
  initialScore: 25000,
  chipValue: 100,
  divider: 10,
  rankPoints4: defaultRankPoints(4) as [number, number, number, number],
  rankPoints3: [...defaultRankPoints(3), 0].slice(0, 3) as [number, number, number],
};
