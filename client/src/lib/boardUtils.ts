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

export interface ExportData {
  version: string;
  createdAt: string;
  squares: BingoSquare[];
}

const STORAGE_KEY = "resobingo-board-2026";
const APP_VERSION = "1.0.0";

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

export function exportBoardData(board: BoardState): ExportData {
  return {
    version: APP_VERSION,
    createdAt: board.createdAt,
    squares: board.squares
  };
}

export function downloadExportData(board: BoardState): void {
  const exportData = exportBoardData(board);
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `resobingo-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportValidationResult {
  valid: boolean;
  error?: string;
  data?: BoardState;
}

export function validateImportData(jsonString: string): ImportValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (typeof parsed !== "object" || parsed === null) {
      return { valid: false, error: "Invalid JSON format: expected an object" };
    }

    if (typeof parsed.version !== "string") {
      return { valid: false, error: "Missing or invalid 'version' field" };
    }

    if (typeof parsed.createdAt !== "string") {
      return { valid: false, error: "Missing or invalid 'createdAt' field" };
    }

    if (!Array.isArray(parsed.squares)) {
      return { valid: false, error: "Missing or invalid 'squares' field: expected an array" };
    }

    if (parsed.squares.length !== 25) {
      return { valid: false, error: `Invalid squares array: expected 25 items, got ${parsed.squares.length}` };
    }

    for (let i = 0; i < 25; i++) {
      const square = parsed.squares[i];
      if (typeof square !== "object" || square === null) {
        return { valid: false, error: `Invalid square at index ${i}: expected an object` };
      }
      if (typeof square.text !== "string") {
        return { valid: false, error: `Invalid square at index ${i}: missing or invalid 'text' field` };
      }
      if (typeof square.isBoss !== "boolean") {
        return { valid: false, error: `Invalid square at index ${i}: missing or invalid 'isBoss' field` };
      }
      if (typeof square.marked !== "boolean") {
        return { valid: false, error: `Invalid square at index ${i}: missing or invalid 'marked' field` };
      }
    }

    if (parsed.squares[12].isBoss !== true) {
      return { valid: false, error: "Invalid board: center square (index 12) must be a Boss square" };
    }

    const boardState: BoardState = {
      squares: parsed.squares as BingoSquare[],
      createdAt: parsed.createdAt
    };

    return { valid: true, data: boardState };
  } catch (e) {
    return { valid: false, error: `Failed to parse JSON: ${(e as Error).message}` };
  }
}

export function clearResoBingoData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("resobingo")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
