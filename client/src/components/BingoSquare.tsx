import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { BingoSquare as BingoSquareType } from "@/lib/boardUtils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil, Flame } from "lucide-react";

interface BingoSquareProps {
  square: BingoSquareType;
  index: number;
  onToggle: () => void;
  onEdit: (newText: string, isBoss?: boolean) => void;
}

export function BingoSquare({ square, index, onToggle, onEdit }: BingoSquareProps) {
  const isMarked = square.marked;
  const isCenter = index === 12;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(square.text);
  const [editIsBoss, setEditIsBoss] = useState(square.isBoss);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    setEditText(square.text);
    setEditIsBoss(square.isBoss);
  }, [square.text, square.isBoss]);

  const handleMouseDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowEditModal(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (!isLongPress.current) {
      onToggle();
    }
    isLongPress.current = false;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ('ontouchstart' in window) {
      return;
    }
    e.preventDefault();
    setShowEditModal(true);
  };

  const handleTouchStart = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowEditModal(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed.length > 0) {
      onEdit(trimmed, editIsBoss);
    }
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setEditText(square.text);
    setEditIsBoss(square.isBoss);
    setShowEditModal(false);
  };

  return (
    <>
      <div className="relative group">
        <button
          role="button"
          aria-pressed={isMarked}
          aria-label={square.isBoss ? `Boss challenge: ${square.text}` : square.text}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          data-testid={`bingo-square-${index}`}
          className={cn(
            "relative aspect-square rounded-lg overflow-visible select-none w-full",
            "flex items-center justify-center p-1",
            "transition-transform duration-100 active:scale-95",
            "bg-card border border-card-border shadow-sm",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            square.isBoss && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
          )}
        >
          <span
            className={cn(
              "text-[11px] sm:text-sm font-medium leading-tight text-center",
              "z-10 px-0.5",
              square.isBoss ? "font-semibold text-amber-700 dark:text-amber-400" : "text-foreground"
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
                  square.isBoss
                    ? "bg-amber-500/50 dark:bg-amber-400/40"
                    : "bg-primary/50 dark:bg-primary/40"
                )}
              />
            </div>
          )}

          {square.isBoss && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center z-20">
              <span className="text-[8px] text-white font-bold">B</span>
            </div>
          )}
        </button>

        <button
          onClick={() => setShowEditModal(true)}
          className={cn(
            "absolute top-0 left-0 w-5 h-5 bg-muted rounded-full flex items-center justify-center z-30",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-muted/80"
          )}
          aria-label="Edit resolution"
          data-testid={`button-edit-${index}`}
        >
          <Pencil className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editIsBoss ? "Edit Boss Resolution" : "Edit Resolution"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[100px]"
            placeholder="Enter your resolution..."
            data-testid="input-edit-resolution"
          />
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2">
              <Flame className={cn("w-4 h-4", editIsBoss ? "text-amber-500" : "text-muted-foreground")} />
              <Label htmlFor="boss-toggle" className="text-sm">
                Boss Challenge
              </Label>
            </div>
            <Switch
              id="boss-toggle"
              checked={editIsBoss}
              onCheckedChange={setEditIsBoss}
              disabled={isCenter}
              data-testid="switch-boss-toggle"
            />
          </div>
          {isCenter && (
            <p className="text-xs text-muted-foreground">
              The center square must always be a Boss challenge.
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelEdit} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} data-testid="button-save-edit">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
