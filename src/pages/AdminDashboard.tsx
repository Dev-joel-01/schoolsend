import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { formatKSH, formatDate } from "@/lib/utils";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import {
  School,
  Users,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Shield,
  LogOut,
  GraduationCap,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin && user) {
      navigate("/");
    }
  }, [isAdmin, user, navigate]);

  const { data: dashboard, isLoading } =
    trpc.dashboard.getAdminDashboard.useQuery(undefined, {
      enabled: isAdmin,
    });

  const toggleMutation = trpc.school.toggleStatus.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  const statusData =
    dashboard.schoolsByStatus?.map((s: any) => ({
      name: s.status,
      value: s.count,
    })) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">EduPay Admin</h1>
              <p className="text-xs text-slate-500">Super Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">
                {user?.name || "Admin"}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">
            Monitor all schools and platform performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Schools</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {dashboard.totalSchools}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  {dashboard.activeSchools} active
                </p>
              </div>
              <div className="p-3 bg-indigo-500 rounded-xl">
                <School className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {dashboard.totalStudents}
                </p>
                <p className="text-xs text-slate-400 mt-1">across all schools</p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Payments</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {formatKSH(dashboard.totalPayments)}
                </p>
                <p className="text-xs text-slate-400 mt-1">lifetime volume</p>
              </div>
              <div className="p-3 bg-amber-500 rounded-xl">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">SMS Sent</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {dashboard.totalSmsSent}
                </p>
                <p className="text-xs text-slate-400 mt-1">total messages</p>
              </div>
              <div className="p-3 bg-violet-500 rounded-xl">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert for expiring subscriptions */}
        {dashboard.expiringSubscriptions > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{dashboard.expiringSubscriptions} schools</span>{" "}
              have subscriptions expiring within 7 days.
            </p>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Schools by Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Schools by Status
            </h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No data
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-slate-600 capitalize">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Volume */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Platform Overview
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Active Schools</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {dashboard.activeSchools} / {dashboard.totalSchools}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${
                        dashboard.totalSchools > 0
                          ? (dashboard.activeSchools / dashboard.totalSchools) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Expiring Soon</span>
                  <span className="text-sm font-semibold text-amber-600">
                    {dashboard.expiringSubscriptions}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${
                        dashboard.totalSchools > 0
                          ? (dashboard.expiringSubscriptions / dashboard.totalSchools) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-indigo-900">
                    Paybill: 4189489
                  </p>
                  <p className="text-xs text-indigo-600">
                    All subscription payments go to this paybill
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">All Schools</h3>
            <p className="text-sm text-slate-500 mt-1">
              Manage registered schools on the platform
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    School
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Code
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Subscription
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    SMS Balance
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.recentSchools?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">
                      {s.code}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.subscriptionStatus === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.subscriptionStatus === "expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {s.subscriptionStatus}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        until {formatDate(s.subscriptionEndDate)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-600">
                      {s.smsBalance}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Toggle status for ${s.name}?`)) {
                            toggleMutation.mutate({ id: s.id });
                          }
                        }}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          s.isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {s.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {(!dashboard.recentSchools ||
                  dashboard.recentSchools.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No schools registered yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
