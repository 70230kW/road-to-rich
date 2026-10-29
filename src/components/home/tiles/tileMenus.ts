import red from '../../../../docs/design/jankane-home/assets/red-five-man.png';
import green from '../../../../docs/design/jankane-home/assets/green-dragon.png';
import circles from '../../../../docs/design/jankane-home/assets/seven-circles.png';
import bird from '../../../../docs/design/jankane-home/assets/one-bamboo.png';

export const TILE_MENUS = [
  { id: 'ranking', name: '順位表', tile: '赤伍萬', eyebrow: 'RANKING', description: '今の立ち位置を、確かめる。', source: red, kind: 'red' },
  { id: 'input', name: '対局入力', tile: '發', eyebrow: 'PLAY & RECORD', description: '次の一局を、記録する。', source: green, kind: 'green' },
  { id: 'dashboard', name: 'ダッシュボード', tile: '七筒', eyebrow: 'DASHBOARD', description: '数字から、自分の麻雀を知る。', source: circles, kind: 'circles' },
  { id: 'rank', name: '段位', tile: '一索', eyebrow: 'YOUR JOURNEY', description: '積み重ねた一局が、称号になる。', source: bird, kind: 'bird' },
] as const;
