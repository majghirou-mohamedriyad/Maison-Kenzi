import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";

const AdminGuard = () => {
  const location = useLocation();
  const session = useAuthSession();

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0F0F0F]">
        <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF] animate-pulse">Chargement…</div>
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export default AdminGuard;
