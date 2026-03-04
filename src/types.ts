export type TargetType = 'Enemy' | 'Ally' | 'Self' | 'All Enemies' | 'Party';
export type CardType = 'Attack' | 'Skill' | 'Power';

export interface StatusEffects {
  vulnerable: number;
  weak: number;
  strength: number;
  frailty: number;
  thorns: number;
}

export interface CardData {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  target: TargetType;
  description: string;
}

export interface CardInstance extends CardData {
  instanceId: string;
}

export type RelicScope = 'Party' | 'Personal';

export interface RelicData {
  id: string;
  name: string;
  scope: RelicScope;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  heroClass: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  block: number;
  threat: number;
  deck: CardInstance[];
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  relics: RelicData[];
  statusEffects: StatusEffects;
  isDowned: boolean;
  readyToEndTurn: boolean;
  hasDrafted: boolean;
}

export interface Intent {
  type: 'attack' | 'buff' | 'debuff' | 'defend';
  target: 'P1' | 'P2' | 'HighestThreat' | 'All';
  amount?: number;
  description: string;
}

export interface Enemy {
  id: string;
  name: string;
  type: 'minion' | 'elite' | 'boss';
  hp: number;
  maxHp: number;
  block: number;
  intent: Intent | null;
  statusEffects: StatusEffects;
}

export type Screen = 'MAP' | 'COMBAT' | 'REWARD' | 'GAME_OVER' | 'VICTORY';

export interface MapNode {
  id: number;
  type: 'combat' | 'elite' | 'campfire' | 'shop' | 'boss';
  completed: boolean;
}

export interface GameState {
  screen: Screen;
  players: Record<string, Player>;
  enemies: Record<string, Enemy>;
  partyRelics: RelicData[];
  gold: number;
  map: MapNode[];
  currentNodeIndex: number;
  turn: number;
  activePlayerId: string;
  combatLog: string[];
  draftCards: CardData[];
  lastAction?: {
    playerId: string;
    targetId?: string;
    cardName: string;
    timestamp: number;
  };
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SELECT_NODE'; payload: { nodeIndex: number } }
  | { type: 'START_COMBAT' }
  | { type: 'PLAY_CARD'; payload: { playerId: string; cardInstanceId: string; targetId?: string } }
  | { type: 'END_TURN' }
  | { type: 'REVIVE_ALLY'; payload: { playerId: string } }
  | { type: 'DRAFT_CARD'; payload: { playerId: string; cardId: string | null } }
  | { type: 'PROCEED_TO_MAP' }
  | { type: 'SET_ACTIVE_PLAYER'; payload: { playerId: string } };
