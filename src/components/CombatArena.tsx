import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Heart, Zap, Target, Skull, Activity, ArrowRight, User, Users, Gem } from 'lucide-react';
import { Player, Enemy, CardInstance, RelicData } from '../types';

const Tooltip = ({ children, content }: { children: React.ReactNode, content: React.ReactNode }) => {
  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 w-max max-w-xs p-2 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded shadow-xl pointer-events-none">
        {content}
      </div>
    </div>
  );
};

export default function CombatArena() {
  const { state, dispatch, playerId, roomId } = useGameState();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  const localPlayerId = playerId || 'P1';
  const activePlayer = state.players[localPlayerId];
  const otherPlayerId = localPlayerId === 'P1' ? 'P2' : 'P1';
  const otherPlayer = state.players[otherPlayerId];

  const handleCardClick = (card: CardInstance) => {
    if (activePlayer.energy < card.cost || activePlayer.readyToEndTurn) return;
    if (selectedCardId === card.instanceId) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(card.instanceId);
    }
  };

  const handleTargetClick = (targetId: string, type: 'enemy' | 'ally' | 'self') => {
    if (!selectedCardId || activePlayer.readyToEndTurn) return;
    const card = activePlayer.hand.find(c => c.instanceId === selectedCardId);
    if (!card) return;

    if (
      (card.target === 'Enemy' && type === 'enemy') ||
      (card.target === 'Ally' && type === 'ally') ||
      (card.target === 'Self' && type === 'self') ||
      (card.target === 'All Enemies' && type === 'enemy') ||
      (card.target === 'Party')
    ) {
      dispatch({
        type: 'PLAY_CARD',
        payload: { playerId: activePlayer.id, cardInstanceId: selectedCardId, targetId }
      });
      setSelectedCardId(null);
    }
  };

  const handleEndTurn = () => {
    if (activePlayer.readyToEndTurn) return;
    dispatch({ type: 'END_TURN' });
    setSelectedCardId(null);
  };

  const renderStatusIcons = (status: any) => {
    return (
      <div className="flex space-x-1 mt-1">
        {status.vulnerable > 0 && (
          <Tooltip content={<div className="font-mono"><b>Vulnerable</b><br/>Take 50% more damage from attacks.</div>}>
            <span className="text-xs bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-700 cursor-help">V:{status.vulnerable}</span>
          </Tooltip>
        )}
        {status.weak > 0 && (
          <Tooltip content={<div className="font-mono"><b>Weak</b><br/>Deal 25% less damage with attacks.</div>}>
            <span className="text-xs bg-green-900/50 text-green-300 px-1 rounded border border-green-700 cursor-help">W:{status.weak}</span>
          </Tooltip>
        )}
        {status.strength > 0 && (
          <Tooltip content={<div className="font-mono"><b>Strength</b><br/>Attacks deal +{status.strength} damage.</div>}>
            <span className="text-xs bg-red-900/50 text-red-300 px-1 rounded border border-red-700 cursor-help">S:{status.strength}</span>
          </Tooltip>
        )}
        {status.frailty > 0 && (
          <Tooltip content={<div className="font-mono"><b>Frailty</b><br/>Block gained from cards is reduced by 25%.</div>}>
            <span className="text-xs bg-yellow-900/50 text-yellow-300 px-1 rounded border border-yellow-700 cursor-help">F:{status.frailty}</span>
          </Tooltip>
        )}
        {status.thorns > 0 && (
          <Tooltip content={<div className="font-mono"><b>Thorns</b><br/>When attacked, deal {status.thorns} damage back.</div>}>
            <span className="text-xs bg-emerald-900/50 text-emerald-300 px-1 rounded border border-emerald-700 cursor-help">T:{status.thorns}</span>
          </Tooltip>
        )}
      </div>
    );
  };

  const renderEnemy = (enemy: Enemy) => {
    const isTargetable = selectedCardId && activePlayer.hand.find(c => c.instanceId === selectedCardId)?.target === 'Enemy';
    const isHovered = hoveredTargetId === enemy.id;

    return (
      <motion.div
        key={enemy.id}
        className={`relative p-4 rounded-xl border-2 flex flex-col items-center bg-zinc-900/80 backdrop-blur-sm transition-colors
          ${isTargetable ? 'cursor-pointer hover:border-red-500 border-zinc-700' : 'border-zinc-800'}
          ${isHovered && isTargetable ? 'ring-2 ring-red-500/50' : ''}
        `}
        onClick={() => handleTargetClick(enemy.id, 'enemy')}
        onMouseEnter={() => setHoveredTargetId(enemy.id)}
        onMouseLeave={() => setHoveredTargetId(null)}
        layout
      >
        {/* Intent Icon */}
        <AnimatePresence>
          {enemy.intent && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              className="absolute -top-10 z-30"
            >
              <Tooltip content={
                <div className="font-mono text-center">
                  <b>{enemy.intent.type.toUpperCase()}</b><br/>
                  {enemy.intent.description}<br/>
                  <span className="text-zinc-400 mt-1 block">Target: {enemy.intent.target}</span>
                </div>
              }>
                <div className="bg-zinc-800 px-3 py-1.5 rounded-lg text-sm font-mono border border-zinc-600 flex items-center space-x-2 shadow-2xl cursor-help hover:bg-zinc-700 transition-colors">
                  {enemy.intent.type === 'attack' && <Target size={16} className="text-red-400" />}
                  {enemy.intent.type === 'defend' && <Shield size={16} className="text-blue-400" />}
                  {enemy.intent.type === 'buff' && <Activity size={16} className="text-green-400" />}
                  {enemy.intent.type === 'debuff' && <Skull size={16} className="text-purple-400" />}
                  <span className="font-bold">{enemy.intent.amount || ''}</span>
                </div>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-24 h-24 bg-zinc-800 rounded-lg mb-4 flex items-center justify-center border border-zinc-700 shadow-inner">
          <Skull size={48} className={enemy.type === 'boss' ? 'text-purple-500' : enemy.type === 'elite' ? 'text-red-500' : 'text-zinc-500'} />
        </div>
        
        <div className="text-sm font-bold font-serif tracking-wider text-zinc-300">{enemy.name}</div>
        
        <div className="flex items-center space-x-2 mt-2 w-full">
          <Tooltip content={<div className="font-mono"><b>Health</b><br/>{enemy.hp} / {enemy.maxHp}</div>}>
            <div className="flex-1 bg-zinc-950 rounded-full h-3 relative overflow-hidden border border-zinc-800 cursor-help w-20">
              <div className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white drop-shadow-md">
                {enemy.hp}/{enemy.maxHp}
              </div>
            </div>
          </Tooltip>
          {enemy.block > 0 && (
            <Tooltip content={<div className="font-mono"><b>Block</b><br/>Prevents {enemy.block} damage.</div>}>
              <div className="flex items-center text-blue-400 text-xs font-mono bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-800/50 cursor-help">
                <Shield size={12} className="mr-1" /> {enemy.block}
              </div>
            </Tooltip>
          )}
        </div>
        {renderStatusIcons(enemy.statusEffects)}
      </motion.div>
    );
  };

  const renderPlayerAvatar = (player: Player, isSelf: boolean) => {
    const isTargetable = selectedCardId && activePlayer.hand.find(c => c.instanceId === selectedCardId)?.target === (isSelf ? 'Self' : 'Ally');
    const isHovered = hoveredTargetId === player.id;

    return (
      <motion.div
        key={player.id}
        className={`relative p-4 rounded-xl border-2 flex flex-col w-48 bg-zinc-900/80 backdrop-blur-sm transition-colors
          ${isTargetable ? 'cursor-pointer hover:border-green-500 border-zinc-700' : 'border-zinc-800'}
          ${isHovered && isTargetable ? 'ring-2 ring-green-500/50' : ''}
          ${player.isDowned ? 'opacity-50 grayscale' : ''}
          ${isSelf ? 'ring-1 ring-zinc-500 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''}
        `}
        onClick={() => handleTargetClick(player.id, isSelf ? 'self' : 'ally')}
        onMouseEnter={() => setHoveredTargetId(player.id)}
        onMouseLeave={() => setHoveredTargetId(null)}
        layout
      >
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-bold font-serif tracking-wider text-zinc-300 flex items-center">
            {isSelf ? <User size={14} className="mr-1 text-zinc-400" /> : <Users size={14} className="mr-1 text-zinc-500" />}
            {player.name}
          </div>
          <Tooltip content={<div className="font-mono"><b>Threat</b><br/>Enemies target the player with the highest threat.</div>}>
            <div className="text-xs font-mono text-orange-400 bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-800/50 flex items-center cursor-help">
              <Target size={10} className="mr-1" /> {player.threat}
            </div>
          </Tooltip>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <Tooltip content={<div className="font-mono"><b>Health</b><br/>{player.hp} / {player.maxHp}</div>}>
            <div className="flex-1 bg-zinc-950 rounded-full h-4 relative overflow-hidden border border-zinc-800 cursor-help w-24">
              <div className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-300" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white drop-shadow-md">
                {player.hp}/{player.maxHp}
              </div>
            </div>
          </Tooltip>
          {player.block > 0 && (
            <Tooltip content={<div className="font-mono"><b>Block</b><br/>Prevents {player.block} damage.</div>}>
              <div className="flex items-center text-blue-400 text-xs font-mono bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-800/50 cursor-help">
                <Shield size={12} className="mr-1" /> {player.block}
              </div>
            </Tooltip>
          )}
        </div>

        <div className="flex justify-between items-center text-xs font-mono mb-2">
          <Tooltip content={<div className="font-mono"><b>Energy</b><br/>Used to play cards.</div>}>
            <div className="flex space-x-1 cursor-help">
              {Array.from({ length: player.maxEnergy }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full border ${i < player.energy ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'bg-zinc-800 border-zinc-700'}`} />
              ))}
            </div>
          </Tooltip>
          <div className="text-zinc-500 flex space-x-2">
            <Tooltip content={<div className="font-mono"><b>Draw Pile</b><br/>Cards left to draw.</div>}>
              <span className="cursor-help">D:{player.drawPile.length}</span>
            </Tooltip>
            <Tooltip content={<div className="font-mono"><b>Discard Pile</b><br/>Played and discarded cards.</div>}>
              <span className="cursor-help">X:{player.discardPile.length}</span>
            </Tooltip>
          </div>
        </div>
        
        {renderStatusIcons(player.statusEffects)}

        {/* Relics */}
        {player.relics.length > 0 && (
          <div className="flex space-x-1 mt-2 border-t border-zinc-800/50 pt-2">
            {player.relics.map(relic => (
              <div key={relic.id}>
                <Tooltip content={<div className="font-mono"><b>{relic.name}</b><br/>{relic.description}</div>}>
                  <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-600 flex items-center justify-center cursor-help hover:bg-zinc-700 transition-colors">
                    <Gem size={12} className="text-cyan-400" />
                  </div>
                </Tooltip>
              </div>
            ))}
          </div>
        )}

        {player.isDowned && !isSelf && activePlayer.energy >= 3 && (
          <button
            className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-500 text-white py-1 rounded font-bold"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REVIVE_ALLY', payload: { playerId: activePlayer.id } }); }}
          >
            Revive (3 Energy)
          </button>
        )}
      </motion.div>
    );
  };

  const renderCard = (card: CardInstance, index: number) => {
    const isSelected = selectedCardId === card.instanceId;
    const canPlay = activePlayer.energy >= card.cost;

    return (
      <motion.div
        key={card.instanceId}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: isSelected ? -20 : 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.8 }}
        whileHover={canPlay && !isSelected ? { y: -10, scale: 1.05 } : {}}
        onClick={() => handleCardClick(card)}
        className={`relative w-40 h-56 rounded-xl border-2 p-3 flex flex-col bg-zinc-900 shadow-xl transition-colors cursor-pointer select-none
          ${isSelected ? 'border-yellow-400 ring-4 ring-yellow-400/20 z-20' : 'border-zinc-700 hover:border-zinc-500 z-10'}
          ${!canPlay ? 'opacity-50 grayscale cursor-not-allowed' : ''}
        `}
        style={{
          marginLeft: index === 0 ? 0 : '-2rem',
          transformOrigin: 'bottom center',
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-xs font-mono font-bold text-yellow-400 shadow-inner">
            {card.cost}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border
            ${card.type === 'Attack' ? 'bg-red-900/30 text-red-400 border-red-800/50' : 
              card.type === 'Skill' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : 
              'bg-purple-900/30 text-purple-400 border-purple-800/50'}
          `}>
            {card.type}
          </div>
        </div>
        
        <div className="text-sm font-serif font-bold text-zinc-200 mb-2 leading-tight h-10 flex items-center">
          {card.name}
        </div>
        
        <div className="w-full h-16 bg-zinc-950 rounded border border-zinc-800 mb-2 overflow-hidden relative">
          {/* Abstract card art placeholder */}
          <div className={`absolute inset-0 opacity-20 ${
            card.type === 'Attack' ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 to-transparent' :
            card.type === 'Skill' ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent' :
            'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500 to-transparent'
          }`} />
        </div>
        
        <div className="text-xs text-zinc-400 leading-snug flex-1">
          {card.description}
        </div>
        
        <div className="text-[9px] text-zinc-600 uppercase tracking-widest text-center mt-1 border-t border-zinc-800 pt-1">
          Target: {card.target}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md z-10">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-serif tracking-widest text-zinc-300">TURN {state.turn}</div>
          <div className="text-sm font-mono text-yellow-500 flex items-center">
            <span className="mr-2">Gold: {state.gold}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm font-mono text-zinc-400">
            Room: <span className="text-white font-bold tracking-widest">{roomId || 'LOCAL'}</span>
          </div>
        </div>
      </div>

      {/* Main Arena */}
      <div className="flex-1 flex flex-col p-8 z-10">
        
        {/* Enemies Row */}
        <div className="flex justify-center space-x-8 mb-16 min-h-[200px]">
          <AnimatePresence>
            {Object.values(state.enemies).map(renderEnemy)}
          </AnimatePresence>
        </div>

        {/* Players Row */}
        <div className="flex justify-center space-x-16 mb-auto">
          {renderPlayerAvatar(activePlayer, true)}
          {renderPlayerAvatar(otherPlayer, false)}
        </div>

      </div>

      {/* Hand & Controls */}
      <div className="h-72 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-end justify-center pb-8 relative z-20">
        
        {/* End Turn Button */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <button
            onClick={handleEndTurn}
            className="group relative px-8 py-4 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl hover:border-zinc-500 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative text-lg font-serif font-bold tracking-widest text-zinc-300 group-hover:text-white flex items-center">
              END TURN <ArrowRight size={20} className="ml-2" />
            </span>
          </button>
        </div>

        {/* Cards */}
        <div className="flex items-end justify-center w-full max-w-4xl px-32">
          <AnimatePresence>
            {activePlayer.hand.map((card, idx) => renderCard(card, idx))}
          </AnimatePresence>
        </div>

      </div>

      {/* Combat Log Overlay (Optional, for debugging/info) */}
      <div className="absolute left-4 bottom-80 w-64 max-h-48 overflow-y-auto bg-zinc-950/80 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-500 z-10 scrollbar-thin scrollbar-thumb-zinc-700">
        {state.combatLog.slice(-10).map((log, i) => (
          <div key={i} className="mb-1">{log}</div>
        ))}
      </div>

    </div>
  );
}
