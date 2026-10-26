import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { login } from "@/lib/auth";
import { sessionStore } from "@/lib/app-store";
import { DEMO_ADMIN } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const session = sessionStore.get();
    if (session) {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = login(email, password);
      if (success) {
        // Redirect to admin dashboard
        navigate({ to: "/admin" });
      } else {
        setError("Invalid email or password. Please use the demo credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail(DEMO_ADMIN.email);
    setPassword(DEMO_ADMIN.password);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="inline-block mb-4">
            <Logo />
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Portal
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-foreground tracking-tight">
            Admin Sign In
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage kitchen orders, tables, and menus
          </p>
        </div>

        <Card className="border shadow-card">
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@savirasa.in"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold"
                size="lg"
              >
                {isLoading ? "Signing in..." : "Sign in to Dashboard"}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-dashed">
              <div className="rounded-xl bg-muted/60 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span className="flex items-center gap-1.5 text-primary">
                    <KeyRound className="h-3.5 w-3.5" /> Demo Credentials
                  </span>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Auto Fill
                  </button>
                </div>
                <div className="grid grid-cols-[50px_1fr] gap-1 text-muted-foreground font-mono">
                  <span>Email:</span>
                  <span className="text-foreground select-all">{DEMO_ADMIN.email}</span>
                  <span>Pass:</span>
                  <span className="text-foreground select-all">{DEMO_ADMIN.password}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back to guest page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}