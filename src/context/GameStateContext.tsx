import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { GameState, GameAction, Player, Enemy, CardInstance, StatusEffects, CardData } from '../types';
import { CARD_DICTIONARY, INITIAL_STATUS, createInitialDeck, ENEMY_TEMPLATES, INITIAL_MAP, RELIC_DICTIONARY } from '../constants';
import { calculateDamage, calculateBlock, generateId, shuffleArray, getHighestThreatPlayerId, generateEnemyIntent } from '../utils/combatUtils';

export const createInitialPlayer = (id: string, name: string): Player => {
  const deck = createInitialDeck().map(c => ({ ...c, instanceId: generateId() }));
  return {
    id,
    name,
    heroClass: 'Warrior',
    hp: 50,
    maxHp: 50,
    energy: 3,
    maxEnergy: 3,
    block: 0,
    threat: 0,
    deck,
    drawPile: [],
    hand: [],
    discardPile: [],
    relics: id === 'P1' ? [RELIC_DICTIONARY.energy_crystal] : [],
    statusEffects: { ...INITIAL_STATUS },
    isDowned: false,
    readyToEndTurn: false,
    hasDrafted: false,
  };
};

export const initialState: GameState = {
  screen: 'MAP',
  players: {
    P1: createInitialPlayer('P1', 'Player 1'),
    P2: createInitialPlayer('P2', 'Player 2'),
  },
  enemies: {},
  partyRelics: [],
  gold: 0,
  map: INITIAL_MAP,
  currentNodeIndex: 0,
  turn: 1,
  activePlayerId: 'P1',
  combatLog: ['Game started.'],
  draftCards: [],
};

const drawCards = (player: Player, amount: number): Player => {
  const newPlayer = { ...player };
  for (let i = 0; i < amount; i++) {
    if (newPlayer.drawPile.length === 0) {
      if (newPlayer.discardPile.length === 0) break;
      newPlayer.drawPile = shuffleArray(newPlayer.discardPile);
      newPlayer.discardPile = [];
    }
    const card = newPlayer.drawPile.pop();
    if (card) newPlayer.hand.push(card);
  }
  return newPlayer;
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return { ...initialState };

    case 'SET_ACTIVE_PLAYER':
      return { ...state, activePlayerId: action.payload.playerId };

    case 'SELECT_NODE':
      return { ...state, currentNodeIndex: action.payload.nodeIndex };

    case 'START_COMBAT': {
      const node = state.map[state.currentNodeIndex];
      let enemies: Record<string, Enemy> = {};
      
      if (node.type === 'combat') {
        const e1: Enemy = { ...ENEMY_TEMPLATES.goblin, id: generateId(), intent: null, statusEffects: { ...INITIAL_STATUS } };
        const e2: Enemy = { ...ENEMY_TEMPLATES.goblin, id: generateId(), intent: null, statusEffects: { ...INITIAL_STATUS } };
        enemies = { [e1.id]: e1, [e2.id]: e2 };
      } else if (node.type === 'elite') {
        const e1: Enemy = { ...ENEMY_TEMPLATES.orc_brute, id: generateId(), intent: null, statusEffects: { ...INITIAL_STATUS } };
        enemies = { [e1.id]: e1 };
      } else if (node.type === 'boss') {
        const e1: Enemy = { ...ENEMY_TEMPLATES.dragon_boss, id: generateId(), intent: null, statusEffects: { ...INITIAL_STATUS } };
        enemies = { [e1.id]: e1 };
      }

      const players = { ...state.players };
      Object.keys(players).forEach(pid => {
        let p = { ...players[pid] };
        p.energy = p.maxEnergy;
        if (p.relics.some(r => r.id === 'energy_crystal')) {
          p.energy += 1;
        }
        p.block = 0;
        p.threat = 0;
        p.statusEffects = { ...INITIAL_STATUS };
        p.drawPile = shuffleArray([...p.deck]);
        p.hand = [];
        p.discardPile = [];
        p.readyToEndTurn = false;
        p = drawCards(p, 5);
        players[pid] = p;
      });

      // Generate initial intents
      Object.keys(enemies).forEach(eid => {
        enemies[eid].intent = generateEnemyIntent(enemies[eid], players) as any;
      });

      return {
        ...state,
        screen: 'COMBAT',
        enemies,
        players,
        turn: 1,
        combatLog: [...state.combatLog, 'Combat started!'],
      };
    }

    case 'PLAY_CARD': {
      const { playerId, cardInstanceId, targetId } = action.payload;
      const player = state.players[playerId];
      const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId);
      if (cardIndex === -1) return state;
      const card = player.hand[cardIndex];

      if (player.energy < card.cost) return state;

      let newState = { ...state };
      let newPlayer = { ...player, energy: player.energy - card.cost };
      newPlayer.hand = [...player.hand];
      newPlayer.hand.splice(cardIndex, 1);
      newPlayer.discardPile = [...player.discardPile, card];

      let logMsg = `${player.name} played ${card.name}.`;

      // Apply card effects
      switch (card.id) {
        case 'strike': {
          if (targetId && newState.enemies[targetId]) {
            const enemy = newState.enemies[targetId];
            const dmg = calculateDamage(6, newPlayer.statusEffects, enemy.statusEffects);
            let actualDmg = dmg;
            let newBlock = enemy.block;
            if (newBlock >= actualDmg) {
              newBlock -= actualDmg;
              actualDmg = 0;
            } else {
              actualDmg -= newBlock;
              newBlock = 0;
            }
            newState.enemies[targetId] = { ...enemy, hp: Math.max(0, enemy.hp - actualDmg), block: newBlock };
            newPlayer.threat += dmg;
            logMsg += ` Dealt ${actualDmg} damage to ${enemy.name}.`;
          }
          break;
        }
        case 'defend': {
          const block = calculateBlock(5, newPlayer.statusEffects);
          newPlayer.block += block;
          logMsg += ` Gained ${block} Block.`;
          break;
        }
        case 'phalanx': {
          if (targetId && newState.players[targetId]) {
            const ally = newState.players[targetId];
            const block = calculateBlock(8, newPlayer.statusEffects);
            newState.players[targetId] = { ...ally, block: ally.block + block };
            logMsg += ` Granted ${block} Block to ${ally.name}.`;
          }
          break;
        }
        case 'provoking_blow': {
          if (targetId && newState.enemies[targetId]) {
            const enemy = newState.enemies[targetId];
            const dmg = calculateDamage(5, newPlayer.statusEffects, enemy.statusEffects);
            let actualDmg = dmg;
            let newBlock = enemy.block;
            if (newBlock >= actualDmg) {
              newBlock -= actualDmg;
              actualDmg = 0;
            } else {
              actualDmg -= newBlock;
              newBlock = 0;
            }
            newState.enemies[targetId] = { ...enemy, hp: Math.max(0, enemy.hp - actualDmg), block: newBlock };
            newPlayer.threat += 15;
            logMsg += ` Dealt ${actualDmg} damage to ${enemy.name} and gained 15 Threat.`;
          }
          break;
        }
        case 'setup': {
          if (targetId && newState.enemies[targetId]) {
            const enemy = newState.enemies[targetId];
            newState.enemies[targetId] = {
              ...enemy,
              statusEffects: { ...enemy.statusEffects, vulnerable: enemy.statusEffects.vulnerable + 2 }
            };
            logMsg += ` Applied 2 Vulnerable to ${enemy.name}.`;
          }
          break;
        }
        case 'execute': {
          if (targetId && newState.enemies[targetId]) {
            const enemy = newState.enemies[targetId];
            const dmg = calculateDamage(10, newPlayer.statusEffects, enemy.statusEffects);
            let actualDmg = dmg;
            let newBlock = enemy.block;
            if (newBlock >= actualDmg) {
              newBlock -= actualDmg;
              actualDmg = 0;
            } else {
              actualDmg -= newBlock;
              newBlock = 0;
            }
            newState.enemies[targetId] = { ...enemy, hp: Math.max(0, enemy.hp - actualDmg), block: newBlock };
            newPlayer.threat += dmg;
            if (enemy.statusEffects.vulnerable > 0) {
              newPlayer.energy += 1;
              logMsg += ` Refunded 1 Energy.`;
            }
            logMsg += ` Dealt ${actualDmg} damage to ${enemy.name}.`;
          }
          break;
        }
        case 'baton_pass': {
          if (targetId && newState.players[targetId]) {
            let ally = newState.players[targetId];
            // Draw 1 card from player's deck and pass to ally
            if (newPlayer.drawPile.length === 0) {
              newPlayer.drawPile = shuffleArray(newPlayer.discardPile);
              newPlayer.discardPile = [];
            }
            const cardToPass = newPlayer.drawPile.pop();
            if (cardToPass) {
              ally = { ...ally, hand: [...ally.hand, cardToPass] };
              newState.players[targetId] = ally;
              logMsg += ` Passed a card to ${ally.name}.`;
            }
          }
          break;
        }
        case 'vanguards_charge': {
          if (targetId && newState.enemies[targetId]) {
            const enemy = newState.enemies[targetId];
            const dmg = calculateDamage(8, newPlayer.statusEffects, enemy.statusEffects);
            let actualDmg = dmg;
            let newBlock = enemy.block;
            if (newBlock >= actualDmg) {
              newBlock -= actualDmg;
              actualDmg = 0;
            } else {
              actualDmg -= newBlock;
              newBlock = 0;
            }
            newState.enemies[targetId] = { ...enemy, hp: Math.max(0, enemy.hp - actualDmg), block: newBlock };
            newPlayer.threat += dmg;
            
            const block = calculateBlock(4, newPlayer.statusEffects);
            newPlayer.block += block;
            const allyId = playerId === 'P1' ? 'P2' : 'P1';
            const ally = newState.players[allyId];
            if (!ally.isDowned) {
              newState.players[allyId] = { ...ally, block: ally.block + block };
            }
            logMsg += ` Dealt ${actualDmg} damage and granted 4 Block to party.`;
          }
          break;
        }
        case 'blood_sacrifice': {
          if (targetId && newState.players[targetId]) {
            newPlayer.hp = Math.max(1, newPlayer.hp - 3);
            const ally = newState.players[targetId];
            newState.players[targetId] = { ...ally, energy: ally.energy + 2 };
            logMsg += ` Lost 3 HP, gave 2 Energy to ${ally.name}.`;
          }
          break;
        }
        case 'aura_of_thorns': {
          // Apply thorns to both players
          Object.keys(newState.players).forEach(pid => {
            newState.players[pid].statusEffects.thorns += 3;
          });
          logMsg += ` Party gained Aura of Thorns.`;
          break;
        }
      }

      newState.players[playerId] = newPlayer;
      newState.combatLog = [...newState.combatLog, logMsg];

      // Check for dead enemies
      let allEnemiesDead = true;
      Object.keys(newState.enemies).forEach(eid => {
        if (newState.enemies[eid].hp <= 0) {
          delete newState.enemies[eid];
        } else {
          allEnemiesDead = false;
        }
      });

      if (allEnemiesDead) {
        newState.screen = 'REWARD';
        newState.gold += 50;
        newState.combatLog = [...newState.combatLog, 'Combat Won!'];
        // Generate draft cards
        const allCards = Object.values(CARD_DICTIONARY);
        newState.draftCards = shuffleArray(allCards).slice(0, 3);
      }

      return newState;
    }

    case 'END_TURN': {
      let newState = { ...state };
      
      // We only mark the active player as ready. The actual enemy turn execution
      // happens when BOTH players are ready.
      const activePlayer = newState.players[newState.activePlayerId];
      if (activePlayer) {
        newState.players[newState.activePlayerId] = { ...activePlayer, readyToEndTurn: true };
      }

      // Check if both players are ready
      const allReady = Object.values(newState.players).every(p => p.readyToEndTurn || p.isDowned);
      
      if (allReady) {
        let logs = [...newState.combatLog, '--- Enemy Turn ---'];

        // Enemy Phase
        Object.keys(newState.enemies).forEach(eid => {
          const enemy = newState.enemies[eid];
          if (!enemy.intent) return;

          let targetId: string = enemy.intent.target;
          if (targetId === 'HighestThreat') {
            targetId = getHighestThreatPlayerId(newState.players);
          }

          if (enemy.intent.type === 'attack') {
            const amount = enemy.intent.amount || 0;
            if (targetId === 'All') {
              Object.keys(newState.players).forEach(pid => {
                const p = newState.players[pid];
                if (p.isDowned) return;
                let dmg = calculateDamage(amount, enemy.statusEffects, p.statusEffects);
                let newBlock = p.block;
                if (newBlock >= dmg) {
                  newBlock -= dmg;
                  dmg = 0;
                } else {
                  dmg -= newBlock;
                  newBlock = 0;
                }
                newState.players[pid] = { ...p, hp: Math.max(0, p.hp - dmg), block: newBlock };
                logs.push(`${enemy.name} attacked ${p.name} for ${dmg}.`);
                
                // Thorns
                if (p.statusEffects.thorns > 0) {
                  newState.enemies[eid] = { ...newState.enemies[eid], hp: Math.max(0, newState.enemies[eid].hp - p.statusEffects.thorns) };
                  logs.push(`${enemy.name} took ${p.statusEffects.thorns} damage from Thorns.`);
                }
              });
            } else {
              const p = newState.players[targetId];
              if (p && !p.isDowned) {
                let dmg = calculateDamage(amount, enemy.statusEffects, p.statusEffects);
                let newBlock = p.block;
                if (newBlock >= dmg) {
                  newBlock -= dmg;
                  dmg = 0;
                } else {
                  dmg -= newBlock;
                  newBlock = 0;
                }
                newState.players[targetId] = { ...p, hp: Math.max(0, p.hp - dmg), block: newBlock };
                logs.push(`${enemy.name} attacked ${p.name} for ${dmg}.`);
                
                // Thorns
                if (p.statusEffects.thorns > 0) {
                  newState.enemies[eid] = { ...newState.enemies[eid], hp: Math.max(0, newState.enemies[eid].hp - p.statusEffects.thorns) };
                  logs.push(`${enemy.name} took ${p.statusEffects.thorns} damage from Thorns.`);
                }
              }
            }
          } else if (enemy.intent.type === 'defend') {
             newState.enemies[eid] = { ...enemy, block: enemy.block + (enemy.intent.amount || 0) };
             logs.push(`${enemy.name} gained ${enemy.intent.amount} Block.`);
          } else if (enemy.intent.type === 'buff') {
             newState.enemies[eid] = { 
               ...enemy, 
               statusEffects: { ...enemy.statusEffects, strength: enemy.statusEffects.strength + (enemy.intent.amount || 0) } 
             };
             logs.push(`${enemy.name} gained ${enemy.intent.amount} Strength.`);
          } else if (enemy.intent.type === 'debuff') {
             Object.keys(newState.players).forEach(pid => {
               const p = newState.players[pid];
               if (!p.isDowned) {
                 newState.players[pid] = {
                   ...p,
                   statusEffects: { ...p.statusEffects, vulnerable: p.statusEffects.vulnerable + (enemy.intent.amount || 0) }
                 };
               }
             });
             logs.push(`${enemy.name} applied ${enemy.intent.amount} Vulnerable to ALL.`);
          }
        });

        // Check for downed players
        let allDowned = true;
        Object.keys(newState.players).forEach(pid => {
          const p = newState.players[pid];
          if (p.hp <= 0 && !p.isDowned) {
            newState.players[pid] = { ...p, isDowned: true, hp: 0, hand: [], discardPile: [...p.discardPile, ...p.hand] };
            logs.push(`${p.name} is DOWNED!`);
          }
          if (!newState.players[pid].isDowned) allDowned = false;
        });

        if (allDowned) {
          return { ...newState, screen: 'GAME_OVER', combatLog: [...logs, 'GAME OVER.'] };
        }

        // Check for dead enemies from thorns
        let allEnemiesDead = true;
        Object.keys(newState.enemies).forEach(eid => {
          if (newState.enemies[eid].hp <= 0) {
            delete newState.enemies[eid];
          } else {
            allEnemiesDead = false;
          }
        });

        if (allEnemiesDead) {
          return { ...newState, screen: 'REWARD', gold: newState.gold + 50, combatLog: [...logs, 'Combat Won!'], draftCards: shuffleArray(Object.values(CARD_DICTIONARY)).slice(0, 3) };
        }

        // Resolution & Reset for next turn
        Object.keys(newState.enemies).forEach(eid => {
          const enemy = newState.enemies[eid];
          enemy.block = 0;
          enemy.statusEffects.vulnerable = Math.max(0, enemy.statusEffects.vulnerable - 1);
          enemy.statusEffects.weak = Math.max(0, enemy.statusEffects.weak - 1);
          enemy.intent = generateEnemyIntent(enemy, newState.players) as any;
        });

        Object.keys(newState.players).forEach(pid => {
          let p = newState.players[pid];
          p.readyToEndTurn = false; // Reset ready state
          if (!p.isDowned) {
            p.block = 0;
            p.energy = p.maxEnergy;
            if (p.relics.some(r => r.id === 'energy_crystal')) {
              p.energy += 1;
            }
            p.statusEffects.vulnerable = Math.max(0, p.statusEffects.vulnerable - 1);
            p.statusEffects.weak = Math.max(0, p.statusEffects.weak - 1);
            p.statusEffects.frailty = Math.max(0, p.statusEffects.frailty - 1);
            
            // Discard hand
            p.discardPile = [...p.discardPile, ...p.hand];
            p.hand = [];
            
            // Draw 5
            p = drawCards(p, 5);
            newState.players[pid] = p;
          }
        });

        newState.turn += 1;
        newState.combatLog = [...logs, `--- Turn ${newState.turn} ---`];
      }

      return newState;
    }

    case 'REVIVE_ALLY': {
      const { playerId } = action.payload;
      const player = state.players[playerId];
      if (player.energy < 3) return state;

      const allyId = playerId === 'P1' ? 'P2' : 'P1';
      const ally = state.players[allyId];
      
      if (!ally.isDowned) return state;

      let newState = { ...state };
      newState.players[playerId] = { ...player, energy: player.energy - 3 };
      newState.players[allyId] = { ...ally, isDowned: false, hp: Math.floor(ally.maxHp * 0.2) };
      newState.combatLog = [...newState.combatLog, `${player.name} revived ${ally.name}! `];
      return newState;
    }

    case 'DRAFT_CARD': {
      const { playerId, cardId } = action.payload;
      let newState = { ...state };
      if (cardId) {
        const cardData = CARD_DICTIONARY[cardId];
        if (cardData) {
          newState.players[playerId].deck.push({ ...cardData, instanceId: generateId() });
        }
      }
      newState.players[playerId].hasDrafted = true;

      // Check if both players have drafted
      if (newState.players.P1.hasDrafted && newState.players.P2.hasDrafted) {
        newState.map[newState.currentNodeIndex].completed = true;
        newState.screen = 'MAP';
        newState.players.P1.hasDrafted = false;
        newState.players.P2.hasDrafted = false;
      }

      return newState;
    }

    case 'PROCEED_TO_MAP': {
      let newState = { ...state };
      newState.map[newState.currentNodeIndex].completed = true;
      newState.screen = 'MAP';
      return newState;
    }

    default:
      return state;
  }
};

export const GameStateContext = createContext<{
  state: GameState;
  dispatch: (action: GameAction) => void;
  roomId: string | null;
  playerId: string | null;
}>({
  state: initialState,
  dispatch: () => null,
  roomId: null,
  playerId: null,
});

export const GameStateProvider = ({ children, roomId, playerId }: { children: ReactNode, roomId: string | null, playerId: string | null }) => {
  const [state, setState] = useState<GameState>(initialState);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setState(docSnap.data() as GameState);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  const dispatch = async (action: GameAction) => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(roomRef);
        if (!docSnap.exists()) return;
        
        const currentState = docSnap.data() as GameState;
        
        // For SET_ACTIVE_PLAYER, we just update local state if it's a local action, 
        // but in multiplayer, activePlayerId is just "who am I". 
        // Wait, activePlayerId should be local to the client, not in Firebase!
        // But since it's in GameState, we'll just override it locally or ignore it.
        // Actually, we should inject the current player's ID into the action if needed.
        
        let stateToProcess = currentState;
        // Inject activePlayerId so the reducer knows who is acting
        if (playerId) {
          stateToProcess = { ...currentState, activePlayerId: playerId };
        }

        const newState = gameReducer(stateToProcess, action);
        transaction.set(roomRef, newState);
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  };

  return (
    <GameStateContext.Provider value={{ state, dispatch, roomId, playerId }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => useContext(GameStateContext);
