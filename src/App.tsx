import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import ActivationCode from "./components/ActivationCode.tsx";

const queryClient = new QueryClient();

// Returns true if the current user has claimed an activation code, null while loading.
const useActivationStatus = () => {
  const { user, loading: authLoading } = useAuth();
  const [activated, setActivated] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setActivated(null); return; }

    (supabase as any)
      .from('activation_codes')
      .select('id')
      .eq('used_by', user.id)
      .eq('used', true)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        setActivated(!!data);
      });
  }, [user, authLoading]);

  return { activated, loading: authLoading || (!!user && activated === null) };
};

// Requires login AND a valid activation code. Redirects appropriately otherwise.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { activated, loading } = useActivationStatus();

  if (loading || authLoading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!activated) return <Navigate to="/activate" replace />;
  return <>{children}</>;
};

// Redirects to app if already logged in and activated; to /activate if logged in but not activated.
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { activated, loading } = useActivationStatus();

  if (loading || authLoading) return <div className="min-h-screen bg-background" />;
  if (user && activated) return <Navigate to="/" replace />;
  if (user && activated === false) return <Navigate to="/activate" replace />;
  return <>{children}</>;
};

// Requires login but not yet activated. Redirects to app if already activated.
const ActivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { activated, loading } = useActivationStatus();

  if (loading || authLoading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (activated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth"     element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/activate" element={<ActivateRoute><ActivationCode /></ActivateRoute>} />
            <Route path="/"         element={<ProtectedRoute><Index /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
