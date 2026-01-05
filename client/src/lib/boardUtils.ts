import { standardResolutions, bossResolutions } from "@/data/resolutions";

export interface BingoSquare {
  text: string;
  isBoss: boolean;
  marked: boolean;
}

export interface BoardState {
  squares: BingoSquare[];
  createdAt: string;
}

const STORAGE_KEY = "resobingo-board-2026";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function validateResolutionLists(): { valid: boolean; error?: string } {
  if (standardResolutions.length < 24) {
    return {
      valid: false,
      error: `Not enough standard resolutions. Need at least 24, but only have ${standardResolutions.length}.`
    };
  }
  if (bossResolutions.length < 1) {
    return {
      valid: false,
      error: "No boss resolutions available. Need at least 1."
    };
  }
  return { valid: true };
}

export function generateNewBoard(): BoardState {
  const validation = validateResolutionLists();
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const shuffledStandard = shuffleArray(standardResolutions).slice(0, 24);
  const randomBoss = shuffleArray(bossResolutions)[0];

  const squares: BingoSquare[] = [];
  let standardIndex = 0;

  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      squares.push({
        text: randomBoss,
        isBoss: true,
        marked: false
      });
    } else {
      squares.push({
        text: shuffledStandard[standardIndex],
        isBoss: false,
        marked: false
      });
      standardIndex++;
    }
  }

  return {
    squares,
    createdAt: new Date().toISOString()
  };
}

export function saveBoard(board: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch (e) {
    console.error("Failed to save board:", e);
  }
}

export function loadBoard(): BoardState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load board:", e);
  }
  return null;
}

export function toggleSquare(board: BoardState, index: number): BoardState {
  const newSquares = board.squares.map((square, i) =>
    i === index ? { ...square, marked: !square.marked } : square
  );
  return { ...board, squares: newSquares };
}

export function resetProgress(board: BoardState): BoardState {
  const newSquares = board.squares.map(square => ({ ...square, marked: false }));
  return { ...board, squares: newSquares };
}

export function checkBingo(squares: BingoSquare[]): boolean {
  const winningLines = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20]
  ];

  return winningLines.some(line =>
    line.every(index => squares[index].marked)
  );
}
