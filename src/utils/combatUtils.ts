import { CardData, Enemy, GameState, Player, StatusEffects } from '../types';

export const calculateDamage = (baseDamage: number, sourceStatus: StatusEffects, targetStatus: StatusEffects) => {
  let damage = baseDamage;
  if (sourceStatus.strength) damage += sourceStatus.strength;
  if (sourceStatus.weak > 0) damage = Math.floor(damage * 0.75);
  if (targetStatus.vulnerable > 0) damage = Math.floor(damage * 1.5);
  return damage;
};

export const calculateBlock = (baseBlock: number, sourceStatus: StatusEffects) => {
  let block = baseBlock;
  if (sourceStatus.frailty > 0) block = Math.floor(block * 0.75);
  return block;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const getHighestThreatPlayerId = (players: Record<string, Player>): string => {
  let highestThreat = -1;
  let targetId = 'P1';
  Object.values(players).forEach(p => {
    if (!p.isDowned && p.threat > highestThreat) {
      highestThreat = p.threat;
      targetId = p.id;
    }
  });
  return targetId;
};

export const getAlivePlayers = (players: Record<string, Player>): Player[] => {
  return Object.values(players).filter(p => !p.isDowned);
};

export const generateEnemyIntent = (enemy: Enemy, players: Record<string, Player>) => {
  const alivePlayers = getAlivePlayers(players);
  if (alivePlayers.length === 0) return null;

  const rand = Math.random();
  if (enemy.type === 'minion') {
    if (rand < 0.7) {
      return { type: 'attack' as const, target: 'HighestThreat' as const, amount: 6, description: 'Attack for 6' };
    } else {
      return { type: 'defend' as const, target: 'All' as const, amount: 5, description: 'Defend for 5' };
    }
  } else if (enemy.type === 'elite') {
    if (rand < 0.6) {
      return { type: 'attack' as const, target: 'HighestThreat' as const, amount: 12, description: 'Attack for 12' };
    } else if (rand < 0.8) {
      return { type: 'attack' as const, target: 'All' as const, amount: 6, description: 'Attack ALL for 6' };
    } else {
      return { type: 'buff' as const, target: 'All' as const, amount: 2, description: 'Gain 2 Strength' };
    }
  } else {
    // Boss
    if (rand < 0.4) {
      return { type: 'attack' as const, target: 'HighestThreat' as const, amount: 20, description: 'Attack for 20' };
    } else if (rand < 0.7) {
      return { type: 'attack' as const, target: 'All' as const, amount: 10, description: 'Attack ALL for 10' };
    } else {
      return { type: 'debuff' as const, target: 'All' as const, amount: 2, description: 'Apply 2 Vulnerable to ALL' };
    }
  }
};
