import { cn } from "@/lib/utils";
import type { BingoSquare as BingoSquareType } from "@/lib/boardUtils";

interface BingoSquareProps {
  square: BingoSquareType;
  index: number;
  onToggle: () => void;
}

export function BingoSquare({ square, index, onToggle }: BingoSquareProps) {
  const isBoss = square.isBoss;
  const isMarked = square.marked;

  return (
    <button
      role="button"
      aria-pressed={isMarked}
      aria-label={isBoss ? `Boss challenge: ${square.text}` : square.text}
      onClick={onToggle}
      data-testid={`bingo-square-${index}`}
      className={cn(
        "relative aspect-square rounded-lg overflow-visible select-none",
        "flex items-center justify-center p-1",
        "transition-transform duration-100 active:scale-95",
        "bg-card border border-card-border",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isBoss && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
      )}
    >
      <span
        className={cn(
          "text-[10px] sm:text-xs font-medium leading-tight text-center",
          "z-10 px-0.5",
          isBoss ? "font-bold text-amber-700 dark:text-amber-400" : "text-foreground"
        )}
      >
        {square.text}
      </span>

      {isMarked && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none",
            "animate-ink-stamp"
          )}
        >
          <div
            className={cn(
              "w-[85%] h-[85%] rounded-full",
              "mix-blend-multiply dark:mix-blend-screen",
              isBoss
                ? "bg-amber-500/50 dark:bg-amber-400/40"
                : "bg-primary/50 dark:bg-primary/40"
            )}
          />
        </div>
      )}

      {isBoss && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center z-20">
          <span className="text-[8px] text-white font-bold">B</span>
        </div>
      )}
    </button>
  );
}
