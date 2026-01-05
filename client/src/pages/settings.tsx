import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  loadBoard,
  saveBoard,
  generateNewBoard,
  resetProgress,
  downloadExportData,
  validateImportData,
  clearResoBingoData
} from "@/lib/boardUtils";
import { ArrowLeft, Download, Upload, RotateCcw, Trash2 } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const board = loadBoard();
    if (!board) {
      toast({
        title: "Export Failed",
        description: "No saved board data found.",
        variant: "destructive"
      });
      return;
    }

    try {
      downloadExportData(board);
      toast({
        title: "Export Successful",
        description: "Your board data has been downloaded."
      });
    } catch (e) {
      toast({
        title: "Export Failed",
        description: (e as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = validateImportData(content);

      if (!result.valid || !result.data) {
        toast({
          title: "Import Failed",
          description: result.error || "Invalid file format.",
          variant: "destructive"
        });
        return;
      }

      saveBoard(result.data);
      toast({
        title: "Import Successful",
        description: "Your board data has been restored. Return to the game to see your progress."
      });
    };

    reader.onerror = () => {
      toast({
        title: "Import Failed",
        description: "Failed to read the file.",
        variant: "destructive"
      });
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const handleResetProgress = () => {
    const board = loadBoard();
    if (!board) {
      toast({
        title: "Reset Failed",
        description: "No saved board data found.",
        variant: "destructive"
      });
      return;
    }

    const resetBoard = resetProgress(board);
    saveBoard(resetBoard);
    toast({
      title: "Progress Reset",
      description: "All marked squares have been cleared. Your board text is preserved."
    });
  };

  const handleResetAll = () => {
    clearResoBingoData();
    const newBoard = generateNewBoard();
    saveBoard(newBoard);
    toast({
      title: "All Data Reset",
      description: "A fresh board has been generated."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="py-4 px-4 border-b border-border">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Management</CardTitle>
            <CardDescription>
              Export, import, or reset your ResoBingo data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleExport}
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleImportClick}
              data-testid="button-import"
            >
              <Upload className="w-4 h-4" />
              Import Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file-import"
            />

            <div className="pt-3 border-t border-border space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start gap-3"
                onClick={handleResetProgress}
                data-testid="button-reset-progress"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Progress
              </Button>
              <p className="text-xs text-muted-foreground pl-7">
                Clears all marked squares but keeps your current board.
              </p>

              <Button
                variant="destructive"
                className="w-full justify-start gap-3"
                onClick={handleResetAll}
                data-testid="button-reset-all"
              >
                <Trash2 className="w-4 h-4" />
                Reset All Data
              </Button>
              <p className="text-xs text-muted-foreground pl-7">
                Clears all saved data and generates a fresh board.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ResoBingo 2026 - Track your New Year's resolutions in a fun bingo format.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Version 1.0.0
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
