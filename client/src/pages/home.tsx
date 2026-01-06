import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { BingoGrid } from "@/components/BingoGrid";
import { Button } from "@/components/ui/button";
import {
  type BoardState,
  saveBoard,
  loadBoard,
  toggleSquare,
  updateSquare,
  resetProgress,
  checkBingo,
  hasExistingBoard,
  regenerateBoardFromSavedLists,
  hasUserLists
} from "@/lib/boardUtils";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Sparkles, RotateCcw, Settings } from "lucide-react";
import { Link } from "wouter";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [board, setBoard] = useState<BoardState | null>(null);
  const [hasBingo, setHasBingo] = useState(false);
  const [showBingoModal, setShowBingoModal] = useState(false);
  const [hasShownBingo, setHasShownBingo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!hasExistingBoard()) {
      setLocation("/create");
      return;
    }

    const savedBoard = loadBoard();
    if (savedBoard) {
      setBoard(savedBoard);
      if (checkBingo(savedBoard.squares)) {
        setHasBingo(true);
        setHasShownBingo(true);
      }
    }
    setIsLoading(false);
  }, [setLocation]);

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

  const handleEditSquare = useCallback((index: number, newText: string, isBoss?: boolean) => {
    if (!board) return;

    const updates: { text?: string; isBoss?: boolean } = { text: newText };
    if (isBoss !== undefined) {
      updates.isBoss = isBoss;
    }

    const newBoard = updateSquare(board, index, updates);
    setBoard(newBoard);
    saveBoard(newBoard);

    toast({
      title: "Resolution Updated",
      description: "Your change has been saved."
    });
  }, [board, toast]);

  const handleNewCard = useCallback(() => {
    if (!hasUserLists()) {
      setLocation("/create");
      return;
    }

    const newBoard = regenerateBoardFromSavedLists();
    if (!newBoard) {
      toast({
        title: "Cannot Generate Card",
        description: "Please update your resolution lists first.",
        variant: "destructive"
      });
      setLocation("/create");
      return;
    }

    setBoard(newBoard);
    saveBoard(newBoard);
    setHasBingo(false);
    setHasShownBingo(false);
    setShowBingoModal(false);

    toast({
      title: "New Card Generated",
      description: "Your resolutions have been shuffled!"
    });
  }, [setLocation, toast]);

  const handleResetProgress = useCallback(() => {
    if (!board) return;
    const resetBoard = resetProgress(board);
    setBoard(resetBoard);
    saveBoard(resetBoard);
    setHasBingo(false);
    setHasShownBingo(false);
    setShowBingoModal(false);

    toast({
      title: "Progress Reset",
      description: "All marks have been cleared."
    });
  }, [board, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-4">
        <div className="relative">
          <Link href="/settings" className="absolute right-0 top-0">
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
          <div className="text-center">
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
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-4 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <BingoGrid
            board={board}
            onToggleSquare={handleToggleSquare}
            onEditSquare={handleEditSquare}
          />
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
