import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const CheckoutHeader = () => {
  return (
    <header className="w-full bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="relative flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm font-light hidden sm:inline">Continuer mes achats</span>
          </Link>

          <Link
            to="/"
            className="absolute left-1/2 transform -translate-x-1/2 py-1"
          >
            <img
              src="/logo.png"
              alt="Maison Kenzi"
              className="h-8 md:h-10 w-auto object-contain dark:invert"
            />
          </Link>

          <Link
            to="/about/service-client"
            className="text-sm font-light text-foreground hover:text-primary transition-colors"
          >
            Aide
          </Link>
        </div>
      </div>
    </header>
  );
};

export default CheckoutHeader;
