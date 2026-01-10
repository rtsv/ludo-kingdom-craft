import { useState } from "react";
import Ludo from "../games/ludo/Ludo";
import SequenceRecall from "../games/sequence-recall/SequenceRecall";

type GameType = 'menu' | 'ludo' | 'sequence-recall';

const Index = () => {
  const [currentGame, setCurrentGame] = useState<GameType>('menu');

  if (currentGame === 'ludo') {
    return <Ludo onBack={() => setCurrentGame('menu')} />;
  }

  if (currentGame === 'sequence-recall') {
    return <SequenceRecall onBack={() => setCurrentGame('menu')} />;
  }

  // Game Selection Menu
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-4xl font-extrabold text-center text-yellow-400 mb-2 drop-shadow-lg">
          🎮 Squadzoo
        </h1>
        <p className="text-center text-white/80 mb-8">Choose a game to play</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => setCurrentGame('ludo')}
            className="w-full p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-2xl border-4 border-yellow-400/50 hover:border-yellow-400 transition-all duration-200 transform hover:scale-[1.02] shadow-xl"
          >
            <div className="text-3xl mb-2">🎲</div>
            <div className="text-xl font-bold text-white">Ludo</div>
            <div className="text-sm text-white/70 mt-1">Classic board game • 2-4 Players</div>
          </button>

          <button
            onClick={() => setCurrentGame('sequence-recall')}
            className="w-full p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-2xl border-4 border-yellow-400/50 hover:border-yellow-400 transition-all duration-200 transform hover:scale-[1.02] shadow-xl"
          >
            <div className="text-3xl mb-2">🧠</div>
            <div className="text-xl font-bold text-white">Sequence Recall</div>
            <div className="text-sm text-white/70 mt-1">Memory game • 1-2 Players</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
