import { CardData, Enemy, MapNode, Player, StatusEffects, RelicData } from './types';

export const RELIC_DICTIONARY: Record<string, RelicData> = {
  energy_crystal: {
    id: 'energy_crystal',
    name: 'Energy Crystal',
    scope: 'Personal',
    description: 'Gain 1 additional Energy at the start of each turn.',
  },
};

export const CARD_DICTIONARY: Record<string, CardData> = {
  strike: {
    id: 'strike',
    name: 'Strike',
    cost: 1,
    type: 'Attack',
    target: 'Enemy',
    description: 'Deal 6 dmg.',
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    cost: 1,
    type: 'Skill',
    target: 'Self',
    description: 'Gain 5 Block.',
  },
  phalanx: {
    id: 'phalanx',
    name: 'Phalanx',
    cost: 2,
    type: 'Skill',
    target: 'Ally',
    description: 'Grant 8 Block to Ally.',
  },
  provoking_blow: {
    id: 'provoking_blow',
    name: 'Provoking Blow',
    cost: 1,
    type: 'Attack',
    target: 'Enemy',
    description: 'Deal 5 dmg. Gain +15 Threat.',
  },
  setup: {
    id: 'setup',
    name: 'Setup',
    cost: 1,
    type: 'Skill',
    target: 'Enemy',
    description: 'Apply 2 Vulnerable.',
  },
  execute: {
    id: 'execute',
    name: 'Execute',
    cost: 2,
    type: 'Attack',
    target: 'Enemy',
    description: 'Deal 10 dmg. If target is Vulnerable, refund 1 Energy.',
  },
  baton_pass: {
    id: 'baton_pass',
    name: 'Baton Pass',
    cost: 0,
    type: 'Skill',
    target: 'Ally',
    description: "Draw 1 card, pass it to Ally's hand.",
  },
  vanguards_charge: {
    id: 'vanguards_charge',
    name: "Vanguard's Charge",
    cost: 2,
    type: 'Attack',
    target: 'Enemy',
    description: 'Deal 8 dmg. You and your Ally gain 4 Block.',
  },
  blood_sacrifice: {
    id: 'blood_sacrifice',
    name: 'Blood Sacrifice',
    cost: 0,
    type: 'Skill',
    target: 'Ally',
    description: 'Lose 3 HP. Give Ally 2 Energy.',
  },
  aura_of_thorns: {
    id: 'aura_of_thorns',
    name: 'Aura of Thorns',
    cost: 3,
    type: 'Power',
    target: 'Party',
    description: 'For the rest of combat, whenever ANY player is attacked, deal 3 dmg back to the attacker.',
  },
};

export const INITIAL_STATUS: StatusEffects = {
  vulnerable: 0,
  weak: 0,
  strength: 0,
  frailty: 0,
  thorns: 0,
};

export const createInitialDeck = (): CardData[] => [
  CARD_DICTIONARY.strike,
  CARD_DICTIONARY.strike,
  CARD_DICTIONARY.strike,
  CARD_DICTIONARY.strike,
  CARD_DICTIONARY.defend,
  CARD_DICTIONARY.defend,
  CARD_DICTIONARY.defend,
  CARD_DICTIONARY.defend,
  CARD_DICTIONARY.provoking_blow,
  CARD_DICTIONARY.phalanx,
];

export const ENEMY_TEMPLATES: Record<string, Omit<Enemy, 'id'>> = {
  goblin: {
    name: 'Goblin',
    type: 'minion',
    hp: 25,
    maxHp: 25,
    block: 0,
    intent: null,
    statusEffects: { ...INITIAL_STATUS },
  },
  orc_brute: {
    name: 'Orc Brute',
    type: 'elite',
    hp: 60,
    maxHp: 60,
    block: 0,
    intent: null,
    statusEffects: { ...INITIAL_STATUS },
  },
  dragon_boss: {
    name: 'Dragon Boss',
    type: 'boss',
    hp: 200,
    maxHp: 200,
    block: 0,
    intent: null,
    statusEffects: { ...INITIAL_STATUS },
  },
};

export const INITIAL_MAP: MapNode[] = [
  { id: 0, type: 'combat', completed: false },
  { id: 1, type: 'combat', completed: false },
  { id: 2, type: 'elite', completed: false },
  { id: 3, type: 'campfire', completed: false },
  { id: 4, type: 'shop', completed: false },
  { id: 5, type: 'boss', completed: false },
];
