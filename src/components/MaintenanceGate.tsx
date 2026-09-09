import { useLocation } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";
import Maintenance from "@/pages/Maintenance";

/**
 * Blocks the customer-facing site when maintenance mode is enabled.
 * Admin routes (/admin*) are never blocked so the toggle can be turned off.
 */
const MaintenanceGate = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { settings } = useAppSettings();

  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) return <>{children}</>;
  if (settings.maintenance_mode) return <Maintenance />;
  return <>{children}</>;
};

export default MaintenanceGate;
