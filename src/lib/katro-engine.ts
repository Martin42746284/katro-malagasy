// Katro Game Engine
// Board layout (indices):
// Opponent: back [7][6][5][4]  front [3][2][1][0]
// Player:   front[0][1][2][3]  back  [4][5][6][7]
// Counter-clockwise distribution path:
//   Front row: right→left (3→2→1→0)
//   Then front-left drops to back-left (0→4)
//   Back row: left→right (4→5→6→7)
//   Then back-right goes up to front-right (7→3)
// Cycle: 3→2→1→0→4→5→6→7→3

export interface GameState {
  playerHoles: number[];    // 8 holes: [front0, front1, front2, front3, back4, back5, back6, back7]
  opponentHoles: number[];  // same layout
  playerScore: number;
  opponentScore: number;
  isPlayerTurn: boolean;
  gameOver: boolean;
  winner: 'player' | 'opponent' | 'draw' | null;
  lastAction: ActionLog | null;
}

export interface ActionLog {
  type: 'distribute' | 'capture' | 'continue' | 'turn_end';
  holeIndex?: number;
  capturedFrom?: number;
  capturedCount?: number;
  side?: 'front' | 'back';
}

// Counter-clockwise next hole mapping
// 0→4, 1→0, 2→1, 3→2, 4→5, 5→6, 6→7, 7→3
const NEXT_HOLE = [4, 0, 1, 2, 5, 6, 7, 3];

function getNextHole(current: number): number {
  return NEXT_HOLE[current];
}

export function createInitialState(): GameState {
  return {
    playerHoles: [2, 2, 2, 2, 2, 2, 2, 2],
    opponentHoles: [2, 2, 2, 2, 2, 2, 2, 2],
    playerScore: 0,
    opponentScore: 0,
    isPlayerTurn: true,
    gameOver: false,
    winner: null,
    lastAction: null,
  };
}

function isFrontRow(index: number): boolean {
  return index >= 0 && index <= 3;
}

// Get the opposing front hole index for a given front hole
function getOpposingFrontIndex(index: number): number {
  return 3 - index;
}

// Get the opposing back hole index for a given front hole
function getOpposingBackIndex(index: number): number {
  return 4 + (3 - index);
}

export function getValidMoves(state: GameState): number[] {
  const holes = state.isPlayerTurn ? state.playerHoles : state.opponentHoles;
  const moves: number[] = [];
  for (let i = 0; i < 8; i++) {
    if (holes[i] > 0) {
      moves.push(i);
    }
  }
  return moves;
}

// Execute a full turn: distribute, continue, capture
export function executeTurn(state: GameState, chosenHole: number): { newState: GameState; steps: ActionStep[] } {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const steps: ActionStep[] = [];

  const myHoles = newState.isPlayerTurn ? newState.playerHoles : newState.opponentHoles;
  const oppHoles = newState.isPlayerTurn ? newState.opponentHoles : newState.playerHoles;

  if (myHoles[chosenHole] === 0) {
    return { newState, steps };
  }

  let currentHole = chosenHole;

  // Main loop: distribute and check continuation
  while (true) {
    const tokens = myHoles[currentHole];
    if (tokens === 0) break;

    myHoles[currentHole] = 0;
    steps.push({ type: 'pickup', hole: currentHole, tokens });

    // Distribute tokens one by one counter-clockwise
    let lastHole = currentHole;
    for (let i = 0; i < tokens; i++) {
      lastHole = getNextHole(lastHole);
      myHoles[lastHole]++;
      steps.push({ type: 'drop', hole: lastHole, tokenCount: myHoles[lastHole] });
    }

    // Check capture before continuation check
    if (isFrontRow(lastHole)) {
      const oppFrontIdx = getOpposingFrontIndex(lastHole);
      const allOppFrontEmpty = oppHoles[0] === 0 && oppHoles[1] === 0 && oppHoles[2] === 0 && oppHoles[3] === 0;

      if (!allOppFrontEmpty && oppHoles[oppFrontIdx] > 0) {
        // Capture from opponent's front — add to current hole for redistribution
        const captured = oppHoles[oppFrontIdx];
        oppHoles[oppFrontIdx] = 0;
        myHoles[lastHole] += captured;
        steps.push({ type: 'capture', hole: oppFrontIdx, capturedCount: captured, side: 'front' });
      } else if (allOppFrontEmpty) {
        // Special rule: capture from opponent's back row
        const oppBackIdx = getOpposingBackIndex(lastHole);
        if (oppHoles[oppBackIdx] > 0) {
          const captured = oppHoles[oppBackIdx];
          oppHoles[oppBackIdx] = 0;
          myHoles[lastHole] += captured;
          steps.push({ type: 'capture', hole: oppBackIdx, capturedCount: captured, side: 'back' });
        }
      }
    }

    // Check continuation: if last hole has more than 1 token (the one we just dropped), continue
    if (myHoles[lastHole] > 1) {
      currentHole = lastHole;
      steps.push({ type: 'continue', hole: lastHole });
      // Continue the loop
    } else {
      // Last token dropped in a hole that now has exactly 1 → turn ends
      steps.push({ type: 'turn_end', hole: lastHole });
      break;
    }
  }

  // Update the state arrays back
  if (newState.isPlayerTurn) {
    newState.playerHoles = myHoles;
    newState.opponentHoles = oppHoles;
  } else {
    newState.opponentHoles = myHoles;
    newState.playerHoles = oppHoles;
  }

  // Check game over
  const playerTotal = newState.playerHoles.reduce((a, b) => a + b, 0);
  const opponentTotal = newState.opponentHoles.reduce((a, b) => a + b, 0);

  if (playerTotal === 0 || opponentTotal === 0) {
    newState.gameOver = true;
    // Remaining tokens on each side = their final score
    newState.playerScore = playerTotal;
    newState.opponentScore = opponentTotal;
    newState.playerHoles = [0, 0, 0, 0, 0, 0, 0, 0];
    newState.opponentHoles = [0, 0, 0, 0, 0, 0, 0, 0];

    if (newState.playerScore > newState.opponentScore) {
      newState.winner = 'player';
    } else if (newState.opponentScore > newState.playerScore) {
      newState.winner = 'opponent';
    } else {
      newState.winner = 'draw';
    }
  }

  // Switch turn
  newState.isPlayerTurn = !newState.isPlayerTurn;

  return { newState, steps };
}

export interface ActionStep {
  type: 'pickup' | 'drop' | 'capture' | 'continue' | 'turn_end';
  hole: number;
  tokens?: number;
  tokenCount?: number;
  capturedCount?: number;
  side?: 'front' | 'back';
}

// AI: evaluate moves and pick the best one
export function aiChooseMove(state: GameState): number {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return -1;

  let bestScore = -Infinity;
  let bestMove = validMoves[0];

  for (const move of validMoves) {
    const { newState } = executeTurn(state, move);
    // Score: maximize own captures, minimize opponent options
    const score = (newState.isPlayerTurn ? newState.opponentScore : newState.playerScore)
      - (newState.isPlayerTurn ? newState.playerScore : newState.opponentScore);

    // Add some randomness to avoid predictability
    const randomBonus = Math.random() * 0.5;
    const totalScore = score + randomBonus;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = move;
    }
  }

  return bestMove;
}
