import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  parseResolutionList,
  getUniqueItems,
  validateUserLists,
  saveUserLists as saveLocalUserLists,
  generateBoardFromLists,
  saveBoard as saveLocalBoard,
  loadUserLists as loadLocalUserLists,
  hasExistingBoard
} from "@/lib/boardUtils";
import { Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Save, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CloudLists {
  standard: string[];
  boss: string[];
}

export default function CreateCard() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();

  const { data: cloudLists, isLoading: isLoadingLists } = useQuery<CloudLists>({
    queryKey: ["/api/lists"],
    retry: 1,
  });

  const localLists = loadLocalUserLists();
  const hasBoard = hasExistingBoard();

  const fromSettings = searchString.includes("from=settings");

  const handleBack = () => {
    if (fromSettings) {
      setLocation("/settings");
    } else {
      setLocation("/");
    }
  };

  const [standardText, setStandardText] = useState("");
  const [bossText, setBossText] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isLoadingLists || isInitialized) return;

    if (cloudLists && (cloudLists.standard.length > 0 || cloudLists.boss.length > 0)) {
      setStandardText(cloudLists.standard.join("\n"));
      setBossText(cloudLists.boss.join("\n"));
    } else if (localLists) {
      setStandardText(localLists.standard.join("\n"));
      setBossText(localLists.boss.join("\n"));
    }
    setIsInitialized(true);
  }, [cloudLists, isLoadingLists, localLists, isInitialized]);

  const isEditing = (cloudLists && (cloudLists.standard.length > 0 || cloudLists.boss.length > 0)) || localLists !== null;
  const canGoBack = isEditing || hasBoard;

  const saveListsMutation = useMutation({
    mutationFn: async (lists: { standard: string[]; boss: string[] }) => {
      await apiRequest("POST", "/api/lists", lists);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
    },
  });

  const saveBoardMutation = useMutation({
    mutationFn: async (boardData: { squares: any[] }) => {
      await apiRequest("POST", "/api/board", { squares: boardData.squares });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/board"] });
    },
  });

  const validation = useMemo(() => {
    const standardItems = parseResolutionList(standardText);
    const bossItems = parseResolutionList(bossText);
    const uniqueStandard = getUniqueItems(standardItems);
    const uniqueBoss = getUniqueItems(bossItems);
    return validateUserLists(uniqueStandard, uniqueBoss);
  }, [standardText, bossText]);

  const handleGenerate = async () => {
    const standardItems = parseResolutionList(standardText);
    const bossItems = parseResolutionList(bossText);
    const uniqueStandard = getUniqueItems(standardItems);
    const uniqueBoss = getUniqueItems(bossItems);

    const check = validateUserLists(uniqueStandard, uniqueBoss);
    if (!check.valid) {
      toast({
        title: "Cannot Generate Card",
        description: check.error,
        variant: "destructive"
      });
      return;
    }

    try {
      saveLocalUserLists(uniqueStandard, uniqueBoss);
      const board = generateBoardFromLists(uniqueStandard, uniqueBoss);
      saveLocalBoard(board);

      await saveListsMutation.mutateAsync({ standard: uniqueStandard, boss: uniqueBoss });
      await saveBoardMutation.mutateAsync({ squares: board.squares });

      toast({
        title: isEditing ? "Card Updated" : "Card Created",
        description: "Your ResoBingo card is ready!"
      });

      setLocation("/");
    } catch (e) {
      toast({
        title: "Error",
        description: (e as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleSaveListsOnly = async () => {
    const standardItems = parseResolutionList(standardText);
    const bossItems = parseResolutionList(bossText);
    const uniqueStandard = getUniqueItems(standardItems);
    const uniqueBoss = getUniqueItems(bossItems);

    const check = validateUserLists(uniqueStandard, uniqueBoss);
    if (!check.valid) {
      toast({
        title: "Cannot Save Lists",
        description: check.error,
        variant: "destructive"
      });
      return;
    }

    try {
      saveLocalUserLists(uniqueStandard, uniqueBoss);
      await saveListsMutation.mutateAsync({ standard: uniqueStandard, boss: uniqueBoss });

      toast({
        title: "Lists Saved",
        description: "Your resolution lists have been saved. Your current card is unchanged."
      });

      handleBack();
    } catch (e) {
      toast({
        title: "Error",
        description: (e as Error).message,
        variant: "destructive"
      });
    }
  };

  if (isLoadingLists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-4 px-4 border-b border-border">
        <div className="max-w-lg mx-auto">
          <div className="relative flex items-center justify-center">
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="absolute left-0"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                {isEditing ? "Edit Your Card" : "Build Your Card"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditing ? "Update your 2026 resolutions" : "Enter your 2026 resolutions"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg">Standard Resolutions</CardTitle>
              <Badge
                variant={validation.standardCount && validation.standardCount >= 24 ? "default" : "secondary"}
                className="text-xs"
              >
                {validation.standardCount || 0} / 24 minimum
              </Badge>
            </div>
            <CardDescription>
              Enter at least 24 unique resolutions, one per line
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="standard-resolutions" className="sr-only">
              Standard resolutions
            </Label>
            <Textarea
              id="standard-resolutions"
              placeholder="Exercise 3 times a week&#10;Read 12 books&#10;Learn a new skill&#10;Save $1000&#10;..."
              value={standardText}
              onChange={(e) => setStandardText(e.target.value)}
              className="min-h-[200px] resize-y"
              data-testid="textarea-standard"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg flex items-center gap-2">
                Boss Resolutions
                <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">B</span>
                </span>
              </CardTitle>
              <Badge
                variant={validation.bossCount && validation.bossCount >= 1 ? "default" : "secondary"}
                className="text-xs"
              >
                {validation.bossCount || 0} / 1 minimum
              </Badge>
            </div>
            <CardDescription>
              Enter your biggest challenge(s) for the center square. One per line.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="boss-resolutions" className="sr-only">
              Boss resolutions
            </Label>
            <Textarea
              id="boss-resolutions"
              placeholder="Run a marathon&#10;Launch a side project&#10;..."
              value={bossText}
              onChange={(e) => setBossText(e.target.value)}
              className="min-h-[100px] resize-y"
              data-testid="textarea-boss"
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {validation.valid ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready to save or generate</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>{validation.error}</span>
            </div>
          )}

          {isEditing && hasBoard && (
            <Button
              variant="outline"
              className="w-full h-12"
              disabled={!validation.valid || saveListsMutation.isPending}
              onClick={handleSaveListsOnly}
              data-testid="button-save-lists"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveListsMutation.isPending ? "Saving..." : "Save Lists Only"}
            </Button>
          )}

          <Button
            className="w-full h-12"
            disabled={!validation.valid || saveListsMutation.isPending || saveBoardMutation.isPending}
            onClick={handleGenerate}
            data-testid="button-generate"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {saveListsMutation.isPending || saveBoardMutation.isPending ? "Saving..." : (isEditing ? "Save & Regenerate Card" : "Generate My Card")}
          </Button>

          {isEditing && hasBoard && (
            <p className="text-xs text-muted-foreground text-center">
              "Save Lists Only" keeps your current card. "Save & Regenerate" creates a new shuffled card and clears progress.
            </p>
          )}

          {canGoBack && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleBack}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
