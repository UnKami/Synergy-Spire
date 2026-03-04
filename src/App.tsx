import React, { useState, useEffect } from 'react';
import { GameStateProvider, useGameState } from './context/GameStateContext';
import MapScreen from './components/MapScreen';
import CombatArena from './components/CombatArena';
import RewardScreen from './components/RewardScreen';
import Lobby from './components/Lobby';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull } from 'lucide-react';
import { signIn } from './firebase';

function GameRouter() {
  const { state, dispatch, roomId } = useGameState();

  if (!roomId) {
    return null; // Handled by App wrapper
  }

  const renderScreen = () => {
    switch (state.screen) {
      case 'MAP':
        return <MapScreen key="map" />;
      case 'COMBAT':
        return <CombatArena key="combat" />;
      case 'REWARD':
        return <RewardScreen key="reward" />;
      case 'GAME_OVER':
        return (
          <motion.div
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-red-950 flex flex-col items-center justify-center text-red-500"
          >
            <Skull size={120} className="mb-8 animate-pulse" />
            <h1 className="text-6xl font-serif tracking-widest mb-12">GAME OVER</h1>
            <button
              onClick={() => dispatch({ type: 'START_GAME' })}
              className="px-8 py-4 bg-red-900 text-red-200 font-bold tracking-widest rounded-xl hover:bg-red-800 transition-colors"
            >
              TRY AGAIN
            </button>
          </motion.div>
        );
      case 'VICTORY':
        return (
          <motion.div
            key="victory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-yellow-950 flex flex-col items-center justify-center text-yellow-500"
          >
            <h1 className="text-6xl font-serif tracking-widest mb-12">VICTORY</h1>
            <button
              onClick={() => dispatch({ type: 'START_GAME' })}
              className="px-8 py-4 bg-yellow-900 text-yellow-200 font-bold tracking-widest rounded-xl hover:bg-yellow-800 transition-colors"
            >
              PLAY AGAIN
            </button>
          </motion.div>
        );
      default:
        return <div key="default">Loading...</div>;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {renderScreen()}
    </AnimatePresence>
  );
}

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signIn();
        setAuthReady(true);
      } catch (e) {
        console.error("Failed to sign in", e);
      }
    };
    initAuth();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!roomId || !playerId) {
    return <Lobby onJoinRoom={(rid, pid) => { setRoomId(rid); setPlayerId(pid); }} />;
  }

  return (
    <GameStateProvider roomId={roomId} playerId={playerId}>
      <GameRouter />
    </GameStateProvider>
  );
}
