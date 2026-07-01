import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/AdminDashboard";
import SchoolDashboard from "@/pages/SchoolDashboard";
import SchoolPayments from "@/pages/SchoolPayments";
import PocketMoney from "@/pages/PocketMoney";
import Communication from "@/pages/Communication";
import SubscriptionPage from "@/pages/SubscriptionPage";
import ParentPayment from "@/pages/ParentPayment";
import SchoolRegistration from "@/pages/SchoolRegistration";

function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SchoolRegistration />} />
      <Route path="/pay" element={<ParentPayment />} />

      {/* School Principal routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SchoolDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <SchoolPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pocket-money"
        element={
          <ProtectedRoute>
            <PocketMoney />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication"
        element={
          <ProtectedRoute>
            <Communication />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
