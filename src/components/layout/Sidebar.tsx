import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  MessageSquare,
  Receipt,
  LogOut,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useState } from "react";

const schoolNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: Wallet, label: "Pocket Money", path: "/pocket-money" },
  { icon: MessageSquare, label: "Communication", path: "/communication" },
  { icon: Receipt, label: "Subscription", path: "/subscription" },
];

const adminNavItems = [
  { icon: Shield, label: "Admin Panel", path: "/admin" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
];

export default function Sidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, school, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isAdmin ? adminNavItems : schoolNavItems;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 h-full">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">
                EduPay
              </h1>
              <p className="text-xs text-slate-500">School Manager</p>
            </div>
          </div>
        </div>

        {/* School Info */}
        {school && (
          <div className="px-4 py-3 mx-4 mt-4 bg-indigo-50 rounded-xl">
            <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">
              School
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
              {school.name}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">Code: {school.code}</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  school.subscriptionStatus === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {school.subscriptionStatus}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-600" />}
              </Link>
            );
          })}
        </nav>

        {/* SMS Balance */}
        {school && (
          <div className="px-4 py-3 mx-4 mb-2 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">SMS Balance</span>
              <span className="text-sm font-bold text-slate-900">
                {school.smsBalance}
              </span>
            </div>
          </div>
        )}

        {/* User */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-700">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {isAdmin ? "Administrator" : "Principal"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">EduPay</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-t border-slate-100 px-4 py-3 space-y-1 bg-white">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 w-full"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
