import { BingoSquare } from "./BingoSquare";
import type { BoardState } from "@/lib/boardUtils";

interface BingoGridProps {
  board: BoardState;
  onToggleSquare: (index: number) => void;
  onEditSquare: (index: number, newText: string, isBoss: boolean) => void;
}

export function BingoGrid({ board, onToggleSquare, onEditSquare }: BingoGridProps) {
  return (
    <div
      className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full max-w-md mx-auto aspect-square"
      data-testid="bingo-grid"
    >
      {board.squares.map((square, index) => (
        <BingoSquare
          key={index}
          square={square}
          index={index}
          onToggle={() => onToggleSquare(index)}
          onEdit={(newText, isBoss) => onEditSquare(index, newText, isBoss)}
        />
      ))}
    </div>
  );
}
