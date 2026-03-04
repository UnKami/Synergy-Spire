import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { motion } from 'framer-motion';
import { Coins, PackageOpen, ArrowRight } from 'lucide-react';

export default function RewardScreen() {
  const { state, dispatch, playerId } = useGameState();
  const localPlayerId = playerId || 'P1';
  const hasDrafted = state.players[localPlayerId].hasDrafted;

  const handleDraft = (cardId: string | null) => {
    dispatch({ type: 'DRAFT_CARD', payload: { playerId: localPlayerId, cardId } });
  };

  const renderDraft = () => {
    if (hasDrafted) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <div className="text-2xl font-serif text-zinc-500 mb-4">Waiting for other player...</div>
          <div className="w-12 h-12 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center p-8 bg-zinc-900/80 rounded-2xl border border-zinc-700 shadow-2xl">
        <h2 className="text-2xl font-serif text-zinc-200 mb-8 tracking-widest">CHOOSE A CARD</h2>
        <div className="flex space-x-6 mb-8">
          {state.draftCards.map(card => (
            <motion.div
              key={card.id}
              whileHover={{ y: -10, scale: 1.05 }}
              onClick={() => handleDraft(card.id)}
              className="w-48 h-64 rounded-xl border-2 border-zinc-600 p-4 flex flex-col bg-zinc-800 cursor-pointer hover:border-yellow-500 transition-colors shadow-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm font-mono font-bold text-yellow-400">
                  {card.cost}
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border
                  ${card.type === 'Attack' ? 'bg-red-900/30 text-red-400 border-red-800/50' : 
                    card.type === 'Skill' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : 
                    'bg-purple-900/30 text-purple-400 border-purple-800/50'}
                `}>
                  {card.type}
                </div>
              </div>
              <div className="text-lg font-serif font-bold text-zinc-100 mb-2 leading-tight">
                {card.name}
              </div>
              <div className="text-sm text-zinc-400 leading-snug flex-1">
                {card.description}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest text-center mt-2 border-t border-zinc-700 pt-2">
                Target: {card.target}
              </div>
            </motion.div>
          ))}
        </div>
        <button
          onClick={() => handleDraft(null)}
          className="px-6 py-2 text-sm font-bold text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors"
        >
          Skip Draft
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-zinc-900/50 to-zinc-950" />
      
      <div className="z-10 flex flex-col items-center w-full max-w-6xl">
        <div className="flex items-center space-x-4 mb-12">
          <PackageOpen size={48} className="text-yellow-500" />
          <h1 className="text-5xl font-serif tracking-widest text-zinc-100">VICTORY</h1>
        </div>

        <div className="flex items-center space-x-2 text-xl font-mono text-yellow-400 mb-16 bg-yellow-900/20 px-6 py-3 rounded-full border border-yellow-700/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
          <Coins size={24} />
          <span>+50 Gold</span>
        </div>

        <div className="flex w-full justify-center">
          {renderDraft()}
        </div>
      </div>
    </div>
  );
}
