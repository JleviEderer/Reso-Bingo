import { useState, useMemo } from "react";
import { useLocation } from "wouter";
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
  saveUserLists,
  generateBoardFromLists,
  saveBoard,
  loadUserLists
} from "@/lib/boardUtils";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function CreateCard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const existingLists = loadUserLists();
  const isEditing = existingLists !== null;

  const [standardText, setStandardText] = useState(
    existingLists ? existingLists.standard.join("\n") : ""
  );
  const [bossText, setBossText] = useState(
    existingLists ? existingLists.boss.join("\n") : ""
  );

  const validation = useMemo(() => {
    const standardItems = parseResolutionList(standardText);
    const bossItems = parseResolutionList(bossText);
    const uniqueStandard = getUniqueItems(standardItems);
    const uniqueBoss = getUniqueItems(bossItems);
    return validateUserLists(uniqueStandard, uniqueBoss);
  }, [standardText, bossText]);

  const handleGenerate = () => {
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
      saveUserLists(uniqueStandard, uniqueBoss);
      const board = generateBoardFromLists(uniqueStandard, uniqueBoss);
      saveBoard(board);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-4 text-center border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          {isEditing ? "Edit Your Card" : "Build Your Card"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditing ? "Update your 2026 resolutions" : "Enter your 2026 resolutions"}
        </p>
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
              <span>Ready to generate your card</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>{validation.error}</span>
            </div>
          )}

          <Button
            className="w-full h-12"
            disabled={!validation.valid}
            onClick={handleGenerate}
            data-testid="button-generate"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isEditing ? "Update & Regenerate Card" : "Generate My Card"}
          </Button>

          {isEditing && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setLocation("/")}
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
