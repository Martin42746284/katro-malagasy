import React from 'react';

interface ScoreBoardProps {
  playerTokens: number;
  opponentTokens: number;
  playerScore: number;
  opponentScore: number;
  isPlayerTurn: boolean;
  gameOver: boolean;
  winner: 'player' | 'opponent' | 'draw' | null;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
  playerTokens,
  opponentTokens,
  playerScore,
  opponentScore,
  isPlayerTurn,
  gameOver,
  winner,
}) => {
  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto px-4">
      {/* Opponent score */}
      <div className={`
        flex flex-col items-center px-4 py-2 rounded-lg transition-all duration-300
        ${!isPlayerTurn && !gameOver ? 'bg-player-opponent/20 ring-2 ring-player-opponent/50' : 'bg-secondary/50'}
      `}>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Adversaire</span>
        <span className="text-2xl font-display font-bold text-foreground">{gameOver ? opponentScore : opponentTokens}</span>
        {gameOver && (
          <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            ({Math.max(0, opponentScore - 16)} capturés + {Math.min(opponentScore, 16)} jetons)
          </span>
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        {gameOver ? (
          <div className="animate-slide-up">
            <span className="text-sm text-muted-foreground">Partie terminée</span>
            <p className="text-lg font-display font-bold text-accent">
              {winner === 'player' ? '🏆 Victoire !' : winner === 'opponent' ? '😔 Défaite' : '🤝 Égalité'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Tour</span>
            <span className={`text-sm font-semibold ${isPlayerTurn ? 'text-player-self' : 'text-player-opponent'}`}>
              {isPlayerTurn ? 'À vous' : 'Adversaire...'}
            </span>
          </div>
        )}
      </div>

      {/* Player score */}
      <div className={`
        flex flex-col items-center px-4 py-2 rounded-lg transition-all duration-300
        ${isPlayerTurn && !gameOver ? 'bg-player-self/20 ring-2 ring-player-self/50' : 'bg-secondary/50'}
      `}>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Vous</span>
        <span className="text-2xl font-display font-bold text-foreground">{gameOver ? playerScore : playerTokens}</span>
        {gameOver && (
          <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            ({Math.max(0, playerScore - 16)} capturés + {Math.min(playerScore, 16)} mes jetons)
          </span>
        )}
      </div>
    </div>
  );
};

export default ScoreBoard;
