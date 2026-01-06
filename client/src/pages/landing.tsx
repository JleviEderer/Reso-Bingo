import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, LogIn, Grid3X3, Trophy, Cloud } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-8 px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          ResoBingo 2026
        </h1>
        <p className="text-muted-foreground mt-2 tracking-wide">Track your resolutions, game-style</p>
      </header>

      <main className="flex-1 px-4 pb-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-left">
                <Grid3X3 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Create your personal 5x5 bingo card with your 2026 goals</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Trophy className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Mark squares as you complete resolutions</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Cloud className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Your progress syncs across all your devices</span>
              </div>
            </div>

            <Button
              className="w-full h-12"
              onClick={handleLogin}
              data-testid="button-login"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Get Started
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        Free to use, your data stays private
      </footer>
    </div>
  );
}
