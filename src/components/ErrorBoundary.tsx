/**
 * Composant de Capture d'Erreurs Global — Maison Kenzi
 *
 * Intercepte les erreurs d'exécution inattendues dans l'arbre de composants React
 * afin d'éviter les écrans blancs et présente une interface de récupération
 * élégante avec possibilité de recharger ou de revenir à l'accueil.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erreur interceptée par ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
          <div className="max-w-md w-full bg-card border border-border/80 rounded-2xl p-8 text-center shadow-xl space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
              <AlertTriangle className="w-7 h-7 stroke-[1.75]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
                Une interruption est survenue
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Notre conciergerie olfactive a rencontré un incident inattendu lors de l'affichage de cette page.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto rounded-xl gap-2 text-xs uppercase tracking-wider font-semibold cursor-pointer h-10 border-border/80"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Accueil</span>
              </Button>

              <Button
                onClick={this.handleReload}
                className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground gap-2 text-xs uppercase tracking-wider font-bold cursor-pointer h-10 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

