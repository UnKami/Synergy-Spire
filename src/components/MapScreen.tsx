import React from 'react';
import { useGameState } from '../context/GameStateContext';
import { motion } from 'framer-motion';
import { Map, Swords, Skull, Flame, ShoppingCart, Crown } from 'lucide-react';

export default function MapScreen() {
  const { state, dispatch } = useGameState();

  const handleSelectNode = (index: number) => {
    if (state.map[index].completed) return;
    dispatch({ type: 'SELECT_NODE', payload: { nodeIndex: index } });
    
    const node = state.map[index];
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      dispatch({ type: 'START_COMBAT' });
    } else {
      // For prototype, just mark as completed and give some reward or skip
      dispatch({ type: 'PROCEED_TO_MAP' });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'combat': return <Swords size={24} />;
      case 'elite': return <Skull size={24} className="text-red-500" />;
      case 'campfire': return <Flame size={24} className="text-orange-500" />;
      case 'shop': return <ShoppingCart size={24} className="text-yellow-500" />;
      case 'boss': return <Crown size={32} className="text-purple-500" />;
      default: return <Map size={24} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-serif mb-12 tracking-widest text-zinc-300">SYNERGY SPIRE</h1>
      
      <div className="flex flex-col items-center space-y-8 relative">
        {/* Draw lines between nodes */}
        <div className="absolute top-0 bottom-0 w-1 bg-zinc-800 -z-10" />
        
        {state.map.map((node, i) => {
          const isCurrent = i === state.currentNodeIndex;
          const isNext = i === state.currentNodeIndex + 1 && state.map[state.currentNodeIndex].completed;
          const isPlayable = isCurrent || isNext;
          const isCompleted = node.completed;

          return (
            <motion.button
              key={node.id}
              whileHover={isPlayable ? { scale: 1.1 } : {}}
              whileTap={isPlayable ? { scale: 0.95 } : {}}
              onClick={() => handleSelectNode(i)}
              disabled={!isPlayable || isCompleted}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors
                ${isCompleted ? 'bg-zinc-800 border-zinc-700 text-zinc-600' : ''}
                ${isPlayable && !isCompleted ? 'bg-zinc-800 border-zinc-400 hover:border-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}
                ${!isPlayable && !isCompleted ? 'bg-zinc-900 border-zinc-800 text-zinc-700' : ''}
              `}
            >
              {getIcon(node.type)}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pt-8 flex space-x-8 text-sm text-zinc-500 font-mono">
        <div className="flex items-center"><Swords size={16} className="mr-2" /> Combat</div>
        <div className="flex items-center"><Skull size={16} className="mr-2 text-red-500" /> Elite</div>
        <div className="flex items-center"><Flame size={16} className="mr-2 text-orange-500" /> Campfire</div>
        <div className="flex items-center"><ShoppingCart size={16} className="mr-2 text-yellow-500" /> Shop</div>
        <div className="flex items-center"><Crown size={16} className="mr-2 text-purple-500" /> Boss</div>
      </div>
    </div>
  );
}
