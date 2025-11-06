"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import AnonymousRoute from "@/components/routes/AnonymousRoute";
import { auth } from "@/firebase/config";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Dashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false);

  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);

  useEffect(() => {
    if (error) {
      toast({
        title: "Login Failed",
        description: "Please check your email and password",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (user) {
      setIsLoginSuccessful(true);
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInWithEmailAndPassword(email, password);
  };

  return (
    <div className="relative w-full flex items-center justify-center p-4">
      {/* Enhanced background geometric shapes with subtle animations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-10 w-48 h-48 bg-neutral-300/20 dark:bg-neutral-700/20 rounded-full blur-xl transform animate-pulse"></div>
        <div className="absolute bottom-16 right-12 w-40 h-40 bg-neutral-400/30 dark:bg-neutral-600/30 rounded-[40%] blur-lg transform rotate-12 animate-pulse"></div>
        <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-neutral-200/30 dark:bg-neutral-800/30 rounded-full blur-md transform -rotate-45 animate-pulse"></div>
        <div className="absolute top-24 right-20 w-28 h-28 bg-neutral-300/25 dark:bg-neutral-700/25 rounded-[60%] blur-xl transform rotate-45 animate-pulse"></div>
        <div className="absolute bottom-10 left-16 w-36 h-36 bg-neutral-200/30 dark:bg-neutral-800/30 rounded-[30%] blur-lg transform -rotate-12 animate-pulse"></div>
      </div>

      <Card className="w-full max-w-[400px] p-8 shadow-lg backdrop-blur-sm bg-white/95 dark:bg-black/95">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back!</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      signInWithEmailAndPassword(email, password);
                    }
                  }}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/signup"
              className="font-medium hover:text-primary transition-colors"
            >
              Sign up
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <AnonymousRoute>
      <Dashboard />
    </AnonymousRoute>
  );
}
