import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BingoGrid } from "@/components/BingoGrid";
import { Button } from "@/components/ui/button";
import {
  type BoardState,
  type BingoSquare,
  saveBoard as saveLocalBoard,
  loadBoard as loadLocalBoard,
  toggleSquare,
  updateSquare,
  resetProgress,
  checkBingo,
  hasExistingBoard
} from "@/lib/boardUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, RotateCcw, Settings, LogOut, Cloud, CloudOff } from "lucide-react";
import { Link } from "wouter";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CloudBoard {
  squares: BingoSquare[];
  createdAt: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [board, setBoard] = useState<BoardState | null>(null);
  const [hasBingo, setHasBingo] = useState(false);
  const [showBingoModal, setShowBingoModal] = useState(false);
  const [hasShownBingo, setHasShownBingo] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { toast } = useToast();
  const { user, logout, isLoggingOut } = useAuth();

  const { data: cloudBoard, isLoading: isLoadingCloud } = useQuery<CloudBoard | null>({
    queryKey: ["/api/board"],
    retry: 1,
  });

  const saveBoardMutation = useMutation({
    mutationFn: async (boardData: BoardState) => {
      await apiRequest("POST", "/api/board", {
        squares: boardData.squares,
      });
    },
    onError: () => {
      setIsOffline(true);
    },
    onSuccess: () => {
      setIsOffline(false);
    },
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isLoadingCloud) return;

    if (cloudBoard && cloudBoard.squares) {
      const boardState: BoardState = {
        squares: cloudBoard.squares,
        createdAt: cloudBoard.createdAt,
      };
      setBoard(boardState);
      saveLocalBoard(boardState);
      if (checkBingo(boardState.squares)) {
        setHasBingo(true);
        setHasShownBingo(true);
      }
    } else {
      const localBoard = loadLocalBoard();
      if (localBoard) {
        setBoard(localBoard);
        if (!isOffline) {
          saveBoardMutation.mutate(localBoard);
        }
        if (checkBingo(localBoard.squares)) {
          setHasBingo(true);
          setHasShownBingo(true);
        }
      } else {
        setLocation("/create");
      }
    }
  }, [cloudBoard, isLoadingCloud, setLocation, isOffline]);

  const handleToggleSquare = useCallback((index: number) => {
    if (!board) return;

    const newBoard = toggleSquare(board, index);
    setBoard(newBoard);
    saveLocalBoard(newBoard);
    saveBoardMutation.mutate(newBoard);

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
  }, [board, hasShownBingo, saveBoardMutation]);

  const handleEditSquare = useCallback((index: number, newText: string, isBoss?: boolean) => {
    if (!board) return;

    const updates: { text?: string; isBoss?: boolean } = { text: newText };
    if (isBoss !== undefined) {
      updates.isBoss = isBoss;
    }

    const newBoard = updateSquare(board, index, updates);
    setBoard(newBoard);
    saveLocalBoard(newBoard);
    saveBoardMutation.mutate(newBoard);

    toast({
      title: "Resolution Updated",
      description: "Your change has been saved."
    });
  }, [board, toast, saveBoardMutation]);

  const handleResetProgress = useCallback(() => {
    if (!board) return;
    const resetBoard = resetProgress(board);
    setBoard(resetBoard);
    saveLocalBoard(resetBoard);
    saveBoardMutation.mutate(resetBoard);
    setHasBingo(false);
    setHasShownBingo(false);
    setShowBingoModal(false);

    toast({
      title: "Progress Reset",
      description: "All marks have been cleared."
    });
  }, [board, toast, saveBoardMutation]);

  if (isLoadingCloud) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your board...</div>
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
          <div className="absolute left-0 top-0 flex items-center gap-1">
            {isOffline ? (
              <CloudOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Cloud className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div className="absolute right-0 top-0 flex items-center gap-1">
            <Link href="/settings">
              <Button variant="ghost" size="icon" data-testid="button-settings">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              disabled={isLoggingOut}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-center pt-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              ResoBingo 2026
            </h1>
            <p className="text-sm text-muted-foreground mt-1 tracking-wide">
              {user?.firstName ? `${user.firstName}'s Resolutions` : "Your Resolution Tracker"}
            </p>
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
            variant="outline"
            onClick={handleResetProgress}
            className="rounded-full px-6"
            data-testid="button-reset"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Progress
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
