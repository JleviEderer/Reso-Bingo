import { useState, useEffect, useCallback } from "react";
import { BingoGrid } from "@/components/BingoGrid";
import { Button } from "@/components/ui/button";
import {
  type BoardState,
  generateNewBoard,
  saveBoard,
  loadBoard,
  toggleSquare,
  resetProgress,
  validateResolutionLists,
  checkBingo
} from "@/lib/boardUtils";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Sparkles, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

export default function Home() {
  const [board, setBoard] = useState<BoardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasBingo, setHasBingo] = useState(false);
  const [showBingoModal, setShowBingoModal] = useState(false);
  const [hasShownBingo, setHasShownBingo] = useState(false);

  useEffect(() => {
    const validation = validateResolutionLists();
    if (!validation.valid) {
      setError(validation.error || "Invalid resolution lists");
      return;
    }

    const savedBoard = loadBoard();
    if (savedBoard) {
      setBoard(savedBoard);
      if (checkBingo(savedBoard.squares)) {
        setHasBingo(true);
        setHasShownBingo(true);
      }
    } else {
      const newBoard = generateNewBoard();
      setBoard(newBoard);
      saveBoard(newBoard);
    }
  }, []);

  const handleToggleSquare = useCallback((index: number) => {
    if (!board) return;

    const newBoard = toggleSquare(board, index);
    setBoard(newBoard);
    saveBoard(newBoard);

    const hasBingoNow = checkBingo(newBoard.squares);
    setHasBingo(hasBingoNow);

    if (hasBingoNow && !hasShownBingo) {
      setHasShownBingo(true);
      setShowBingoModal(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [board, hasShownBingo]);

  const handleNewCard = useCallback(() => {
    try {
      const newBoard = generateNewBoard();
      setBoard(newBoard);
      saveBoard(newBoard);
      setHasBingo(false);
      setHasShownBingo(false);
      setShowBingoModal(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const handleResetProgress = useCallback(() => {
    if (!board) return;
    const resetBoard = resetProgress(board);
    setBoard(resetBoard);
    saveBoard(resetBoard);
    setHasBingo(false);
    setHasShownBingo(false);
    setShowBingoModal(false);
  }, [board]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <span className="text-2xl text-destructive">X</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Configuration Error</h2>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button onClick={handleNewCard} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          ResoBingo 2026
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your Resolution Tracker</p>
        {hasBingo && (
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
            BINGO!
          </div>
        )}
      </header>

      <main className="flex-1 px-4 pb-4 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <BingoGrid board={board} onToggleSquare={handleToggleSquare} />
        </div>

        <div className="mt-6 flex gap-2 justify-center">
          <Button
            variant="secondary"
            onClick={handleNewCard}
            className="rounded-full px-6"
            data-testid="button-new-card"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Card
          </Button>
          <Button
            variant="outline"
            onClick={handleResetProgress}
            className="rounded-full px-6"
            data-testid="button-reset"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </main>

      {showBingoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-sm w-full animate-in fade-in zoom-in duration-300">
            <CardContent className="pt-8 pb-6 px-8 text-center space-y-6">
              <div className="text-6xl">
                <Sparkles className="w-16 h-16 mx-auto text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">BINGO!</h2>
                <p className="text-muted-foreground">
                  You've got momentum. Don't let it fade.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full h-14"
                  onClick={() => window.open("https://compounded.app", "_blank")}
                  data-testid="button-compounded"
                >
                  Keep it going with Compounded
                </Button>
                <button
                  onClick={() => setShowBingoModal(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-close-modal"
                >
                  Close & Continue Playing
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
