/**
 * Point d'Entrée Principal de l'Application Maison Kenzi
 * Configure les fournisseurs de contexte globaux (QueryClient, Tooltip, Router, Theme, Panier),
 * le routage dynamique et les outils de mesure de performance Vercel Speed Insights.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./store/cart";
import { ThemeProvider } from "./contexts/ThemeContext";
import MaintenanceGate from "./components/MaintenanceGate";
import ChatBotMount from "./components/ChatBotMount";
import FloatingCartButton from "./components/cart/FloatingCartButton";
import BackToTop from "./components/BackToTop";

import Index from "./pages/Index";
import Collection from "./pages/Category";
import ParfumDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import OrderTracking from "./pages/OrderTracking";
import ServiceClient from "./pages/about/CustomerCare";
import About from "./pages/About";
import AdminLogin from "./admin/AdminLogin";
import AdminGuard from "./admin/AdminGuard";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Produits from "./admin/pages/Produits";
import CategoriesAdmin from "./admin/pages/Categories";
import Commandes from "./admin/pages/Commandes";
import Parametres from "./admin/pages/Parametres";
import Finances from "./admin/pages/Finances";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <ThemeProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <ScrollToTop />
            <MaintenanceGate>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/collection/:collection" element={<Collection />} />
              <Route path="/parfum/:parfumId" element={<ParfumDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/about" element={<About />} />
              <Route path="/service-client" element={<ServiceClient />} />
              <Route path="/about/service-client" element={<ServiceClient />} />
              <Route path="/contact" element={<ServiceClient />} />
              <Route path="/suivi-commande" element={<OrderTracking />} />
              <Route path="/tracking" element={<OrderTracking />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminGuard />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<Dashboard />} />
                  <Route path="/admin/produits" element={<Produits />} />
                  <Route path="/admin/categories" element={<CategoriesAdmin />} />
                  <Route path="/admin/commandes" element={<Commandes />} />
                  <Route path="/admin/finances" element={<Finances />} />
                  <Route path="/admin/parametres" element={<Parametres />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingCartButton />
            <ChatBotMount />
            <BackToTop />
            <SpeedInsights />
            </MaintenanceGate>

          </CartProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
