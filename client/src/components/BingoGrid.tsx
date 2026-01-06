import { BingoSquare } from "./BingoSquare";
import type { BoardState } from "@/lib/boardUtils";

interface BingoGridProps {
  board: BoardState;
  onToggleSquare: (index: number) => void;
  onEditSquare: (index: number, newText: string, isBoss?: boolean) => void;
}

export function BingoGrid({ board, onToggleSquare, onEditSquare }: BingoGridProps) {
  return (
    <div className="w-full max-w-md mx-auto p-4 bg-card/50 rounded-xl shadow-lg">
      <div
        className="grid grid-cols-5 gap-2 aspect-square"
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
    </div>
  );
}
