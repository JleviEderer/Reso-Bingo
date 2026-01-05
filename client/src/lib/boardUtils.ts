export interface BingoSquare {
  text: string;
  isBoss: boolean;
  marked: boolean;
}

export interface BoardState {
  squares: BingoSquare[];
  createdAt: string;
}

export interface UserLists {
  standard: string[];
  boss: string[];
}

export interface ExportDataV2 {
  version: number;
  createdAt: string;
  squares: BingoSquare[];
  userLists: UserLists;
}

const STORAGE_KEY_BOARD = "resobingo-board-2026";
const STORAGE_KEY_USER_STANDARD = "resobingo-user-standard";
const STORAGE_KEY_USER_BOSS = "resobingo-user-boss";
const EXPORT_VERSION = 2;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function parseResolutionList(text: string): string[] {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

export function getUniqueItems(items: string[]): string[] {
  return Array.from(new Set(items));
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  standardCount?: number;
  bossCount?: number;
}

export function validateUserLists(standard: string[], boss: string[]): ValidationResult {
  const uniqueStandard = getUniqueItems(standard);
  const uniqueBoss = getUniqueItems(boss);

  if (uniqueBoss.length < 1) {
    return {
      valid: false,
      error: "Need at least 1 Boss resolution.",
      standardCount: uniqueStandard.length,
      bossCount: 0
    };
  }

  if (uniqueStandard.length < 24) {
    return {
      valid: false,
      error: `Need at least 24 unique standard resolutions. You have ${uniqueStandard.length}.`,
      standardCount: uniqueStandard.length,
      bossCount: uniqueBoss.length
    };
  }

  return {
    valid: true,
    standardCount: uniqueStandard.length,
    bossCount: uniqueBoss.length
  };
}

export function saveUserLists(standard: string[], boss: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_STANDARD, JSON.stringify(standard));
    localStorage.setItem(STORAGE_KEY_USER_BOSS, JSON.stringify(boss));
  } catch (e) {
    console.error("Failed to save user lists:", e);
  }
}

export function loadUserLists(): UserLists | null {
  try {
    const standardJson = localStorage.getItem(STORAGE_KEY_USER_STANDARD);
    const bossJson = localStorage.getItem(STORAGE_KEY_USER_BOSS);

    if (standardJson && bossJson) {
      return {
        standard: JSON.parse(standardJson),
        boss: JSON.parse(bossJson)
      };
    }
  } catch (e) {
    console.error("Failed to load user lists:", e);
  }
  return null;
}

export function generateBoardFromLists(standard: string[], boss: string[]): BoardState {
  const uniqueStandard = getUniqueItems(standard);
  const uniqueBoss = getUniqueItems(boss);

  const validation = validateUserLists(uniqueStandard, uniqueBoss);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const randomBoss = shuffleArray(uniqueBoss)[0];

  const standardWithoutBoss = uniqueStandard.filter(item => item !== randomBoss);

  if (standardWithoutBoss.length < 24) {
    throw new Error("Not enough unique standard resolutions after excluding boss. Need at least 24 items that don't overlap with your boss resolution.");
  }

  const shuffledStandard = shuffleArray(standardWithoutBoss).slice(0, 24);

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

export function regenerateBoardFromSavedLists(): BoardState | null {
  const lists = loadUserLists();
  if (!lists) {
    return null;
  }

  try {
    return generateBoardFromLists(lists.standard, lists.boss);
  } catch (e) {
    console.error("Failed to regenerate board:", e);
    return null;
  }
}

export function saveBoard(board: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEY_BOARD, JSON.stringify(board));
  } catch (e) {
    console.error("Failed to save board:", e);
  }
}

export function loadBoard(): BoardState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BOARD);
    if (saved) {
      const board: BoardState = JSON.parse(saved);
      const bossIndices = board.squares
        .map((s, i) => s.isBoss ? i : -1)
        .filter(i => i !== -1);
      
      if (bossIndices.length === 0) {
        board.squares[12] = { ...board.squares[12], isBoss: true };
      } else if (bossIndices.length > 1) {
        board.squares = board.squares.map((s, i) => 
          i === bossIndices[0] ? s : { ...s, isBoss: false }
        );
      }
      return board;
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

export function updateSquareText(board: BoardState, index: number, newText: string): BoardState {
  const newSquares = board.squares.map((square, i) =>
    i === index ? { ...square, text: newText } : square
  );
  return { ...board, squares: newSquares };
}

export function updateSquare(board: BoardState, index: number, newText: string, isBoss: boolean): BoardState {
  const bossIndices = board.squares
    .map((s, i) => s.isBoss ? i : -1)
    .filter(i => i !== -1);
  const currentBossIndex = bossIndices[0] ?? -1;
  
  if (!isBoss && index === currentBossIndex) {
    return { ...board, squares: board.squares.map((square, i) =>
      i === index ? { ...square, text: newText } : square
    )};
  }
  
  const newSquares = board.squares.map((square, i) => {
    if (i === index) {
      return { ...square, text: newText, isBoss };
    }
    if (isBoss && i !== index) {
      return { ...square, isBoss: false };
    }
    return square;
  });
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

export function exportBoardData(board: BoardState): ExportDataV2 {
  const userLists = loadUserLists() || { standard: [], boss: [] };
  return {
    version: EXPORT_VERSION,
    createdAt: board.createdAt,
    squares: board.squares,
    userLists
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
  data?: {
    board: BoardState;
    userLists?: UserLists;
  };
}

export function validateImportData(jsonString: string): ImportValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (typeof parsed !== "object" || parsed === null) {
      return { valid: false, error: "Invalid JSON format: expected an object" };
    }

    if (parsed.version === undefined) {
      return { valid: false, error: "Missing 'version' field" };
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

    const bossCount = parsed.squares.filter((s: BingoSquare) => s.isBoss).length;
    if (bossCount !== 1) {
      return { valid: false, error: `Invalid board: must have exactly one Boss square, found ${bossCount}` };
    }

    const boardState: BoardState = {
      squares: parsed.squares as BingoSquare[],
      createdAt: parsed.createdAt
    };

    let userLists: UserLists | undefined;
    if (parsed.userLists && typeof parsed.userLists === "object") {
      if (Array.isArray(parsed.userLists.standard) && Array.isArray(parsed.userLists.boss)) {
        const validStandard = parsed.userLists.standard.every((s: unknown) => typeof s === "string");
        const validBoss = parsed.userLists.boss.every((s: unknown) => typeof s === "string");
        if (validStandard && validBoss) {
          userLists = {
            standard: parsed.userLists.standard,
            boss: parsed.userLists.boss
          };
        }
      }
    }

    return { valid: true, data: { board: boardState, userLists } };
  } catch (e) {
    return { valid: false, error: `Failed to parse JSON: ${(e as Error).message}` };
  }
}

export function applyImportData(data: { board: BoardState; userLists?: UserLists }): void {
  saveBoard(data.board);
  if (data.userLists) {
    saveUserLists(data.userLists.standard, data.userLists.boss);
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

export function hasExistingBoard(): boolean {
  return loadBoard() !== null;
}

export function hasUserLists(): boolean {
  return loadUserLists() !== null;
}
