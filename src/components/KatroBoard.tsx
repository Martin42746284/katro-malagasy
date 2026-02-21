import React, { useState, useCallback, useRef, useEffect } from 'react';
import Hole from './Hole';
import ScoreBoard from './ScoreBoard';
import {
  GameState,
  createInitialState,
  executeTurn,
  aiChooseMove,
  getValidMoves,
} from '@/lib/katro-engine';

const KatroBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedHole, setHighlightedHole] = useState<{ side: 'player' | 'opponent'; index: number } | null>(null);
  const [capturingHole, setCapturingHole] = useState<{ side: 'player' | 'opponent'; index: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
  };

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  const handlePlayerMove = useCallback((holeIndex: number) => {
    if (!gameState.isPlayerTurn || isAnimating || gameState.gameOver) return;
    if (gameState.playerHoles[holeIndex] === 0) return;

    setIsAnimating(true);
    setHighlightedHole({ side: 'player', index: holeIndex });

    const { newState, steps } = executeTurn(gameState, holeIndex);

    // Animate steps
    let delay = 300;
    for (const step of steps) {
      const t = setTimeout(() => {
        if (step.type === 'capture') {
          setCapturingHole({ side: 'opponent', index: step.hole });
          setTimeout(() => setCapturingHole(null), 600);
        }
        if (step.type === 'continue') {
          setHighlightedHole({ side: 'player', index: step.hole });
        }
      }, delay);
      timeoutRef.current.push(t);
      delay += step.type === 'capture' ? 500 : 150;
    }

    // Apply final state after animation
    const finalT = setTimeout(() => {
      setGameState(newState);
      setHighlightedHole(null);
      setIsAnimating(false);

      // AI turn
      if (!newState.gameOver && !newState.isPlayerTurn) {
        const aiT = setTimeout(() => {
          executeAiTurn(newState);
        }, 800);
        timeoutRef.current.push(aiT);
      }
    }, delay + 200);
    timeoutRef.current.push(finalT);
  }, [gameState, isAnimating]);

  const executeAiTurn = useCallback((state: GameState) => {
    const move = aiChooseMove(state);
    if (move === -1) return;

    setIsAnimating(true);
    setHighlightedHole({ side: 'opponent', index: move });

    const { newState, steps } = executeTurn(state, move);

    let delay = 300;
    for (const step of steps) {
      const t = setTimeout(() => {
        if (step.type === 'capture') {
          setCapturingHole({ side: 'player', index: step.hole });
          setTimeout(() => setCapturingHole(null), 600);
        }
        if (step.type === 'continue') {
          setHighlightedHole({ side: 'opponent', index: step.hole });
        }
      }, delay);
      timeoutRef.current.push(t);
      delay += step.type === 'capture' ? 500 : 150;
    }

    const finalT = setTimeout(() => {
      setGameState(newState);
      setHighlightedHole(null);
      setIsAnimating(false);
    }, delay + 200);
    timeoutRef.current.push(finalT);
  }, []);

  const handleRestart = () => {
    clearTimeouts();
    setIsAnimating(false);
    setHighlightedHole(null);
    setCapturingHole(null);
    setGameState(createInitialState());
  };

  const validMoves = gameState.isPlayerTurn ? getValidMoves(gameState) : [];

  // Opponent holes displayed: back row (7,6,5,4) then front row (3,2,1,0) — reversed for visual
  const opponentBack = [7, 6, 5, 4];
  const opponentFront = [3, 2, 1, 0];

  // Player holes: front row (0,1,2,3) then back row (4,5,6,7)
  const playerFront = [0, 1, 2, 3];
  const playerBack = [4, 5, 6, 7];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <ScoreBoard
        playerTokens={gameState.playerHoles.reduce((a, b) => a + b, 0)}
        opponentTokens={gameState.opponentHoles.reduce((a, b) => a + b, 0)}
        playerScore={gameState.playerScore}
        opponentScore={gameState.opponentScore}
        isPlayerTurn={gameState.isPlayerTurn}
        gameOver={gameState.gameOver}
        winner={gameState.winner}
      />

      {/* Game Board */}
      <div
        className="relative w-full rounded-2xl p-4 sm:p-6"
        style={{
          background: 'linear-gradient(145deg, hsl(var(--board)), hsl(var(--board-edge)))',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Board texture overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.03) 20px,
              rgba(255,255,255,0.03) 21px
            )`,
          }}
        />

        {/* Opponent side label */}
        <div className="text-center mb-3">
          <span className="text-xs uppercase tracking-widest text-player-opponent/70 font-semibold">
            Adversaire
          </span>
        </div>

        {/* Opponent back row */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-2">
          {opponentBack.map((idx) => (
            <Hole
              key={`opp-${idx}`}
              tokens={gameState.opponentHoles[idx]}
              index={idx}
              isPlayerSide={false}
              isFront={false}
              isClickable={false}
              isHighlighted={highlightedHole?.side === 'opponent' && highlightedHole.index === idx}
              isCapturing={capturingHole?.side === 'opponent' && capturingHole.index === idx}
              onClick={() => {}}
            />
          ))}
        </div>

        {/* Opponent front row */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-4">
          {opponentFront.map((idx) => (
            <Hole
              key={`opp-front-${idx}`}
              tokens={gameState.opponentHoles[idx]}
              index={idx}
              isPlayerSide={false}
              isFront={true}
              isClickable={false}
              isHighlighted={highlightedHole?.side === 'opponent' && highlightedHole.index === idx}
              isCapturing={capturingHole?.side === 'opponent' && capturingHole.index === idx}
              onClick={() => {}}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">VS</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Player front row */}
        <div className="flex justify-center gap-2 sm:gap-3 mt-4 mb-2">
          {playerFront.map((idx) => (
            <Hole
              key={`player-front-${idx}`}
              tokens={gameState.playerHoles[idx]}
              index={idx}
              isPlayerSide={true}
              isFront={true}
              isClickable={gameState.isPlayerTurn && !isAnimating && !gameState.gameOver && validMoves.includes(idx)}
              isHighlighted={highlightedHole?.side === 'player' && highlightedHole.index === idx}
              isCapturing={capturingHole?.side === 'player' && capturingHole.index === idx}
              onClick={() => handlePlayerMove(idx)}
            />
          ))}
        </div>

        {/* Player back row */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {playerBack.map((idx) => (
            <Hole
              key={`player-back-${idx}`}
              tokens={gameState.playerHoles[idx]}
              index={idx}
              isPlayerSide={true}
              isFront={false}
              isClickable={gameState.isPlayerTurn && !isAnimating && !gameState.gameOver && validMoves.includes(idx)}
              isHighlighted={highlightedHole?.side === 'player' && highlightedHole.index === idx}
              isCapturing={capturingHole?.side === 'player' && capturingHole.index === idx}
              onClick={() => handlePlayerMove(idx)}
            />
          ))}
        </div>

        {/* Player side label */}
        <div className="text-center mt-3">
          <span className="text-xs uppercase tracking-widest text-player-self/70 font-semibold">
            Vous
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleRestart}
          disabled={!gameState.gameOver}
          className="px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm
            hover:bg-secondary/80 transition-all duration-200 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Nouvelle Partie
        </button>
      </div>

      {/* Instructions hint */}
      {!gameState.gameOver && gameState.isPlayerTurn && !isAnimating && (
        <p className="text-xs text-muted-foreground text-center animate-slide-up">
          Cliquez sur un de vos trous pour distribuer les jetons
        </p>
      )}
    </div>
  );
};

export default KatroBoard;
