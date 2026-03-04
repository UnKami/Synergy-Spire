import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { initialState, createInitialPlayer } from '../context/GameStateContext';
import { motion } from 'framer-motion';

export default function Lobby({ onJoinRoom }: { onJoinRoom: (roomId: string, playerId: string) => void }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }
    setLoading(true);
    setError('');
    const newRoomId = generateRoomCode();
    
    try {
      const startingState = { ...initialState };
      startingState.players.P1 = createInitialPlayer('P1', name);
      startingState.players.P2 = createInitialPlayer('P2', 'Waiting for Player 2...');
      
      await setDoc(doc(db, 'rooms', newRoomId), startingState);
      onJoinRoom(newRoomId, 'P1');
    } catch (e) {
      console.error(e);
      setError('Failed to create room');
    }
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 4) {
      setError('Please enter a valid 4-character room code');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const code = roomCode.toUpperCase();
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        const state = roomSnap.data();
        // Update P2's name
        state.players.P2.name = name;
        await setDoc(roomRef, state);
        onJoinRoom(code, 'P2');
      } else {
        setError('Room not found');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to join room');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 bg-zinc-900/80 backdrop-blur-md p-8 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-md flex flex-col items-center"
      >
        <h1 className="text-4xl font-serif tracking-widest text-zinc-200 mb-8 text-center">SYNERGY SPIRE</h1>
        
        <div className="w-full space-y-6">
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Display Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
              placeholder="Enter your name"
            />
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button 
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full bg-red-900/50 hover:bg-red-800/50 border border-red-700/50 text-red-200 font-bold py-3 rounded-lg transition-colors mb-4"
            >
              CREATE NEW ROOM
            </button>

            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:border-red-500 transition-colors uppercase text-center font-mono tracking-widest"
                placeholder="CODE"
              />
              <button 
                onClick={handleJoinRoom}
                disabled={loading}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                JOIN
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center font-mono bg-red-900/20 py-2 rounded border border-red-900/50">
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
