import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { formatKSH } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CreditCard,
  GraduationCap,
  Wallet,
} from "lucide-react";

export default function SchoolPayments() {
  const { school } = useAuth();
  const schoolId = school?.id;
  const [activeTab, setActiveTab] = useState<"fees" | "pocket_money">("fees");

  const { data: feesByStream, isLoading: feesLoading } =
    trpc.payment.getFeesByStream.useQuery(
      { schoolId: schoolId! },
      { enabled: !!schoolId && activeTab === "fees" }
    );

  const { data: pocketByStream, isLoading: pocketLoading } =
    trpc.payment.getPocketMoneyByStream.useQuery(
      { schoolId: schoolId! },
      { enabled: !!schoolId && activeTab === "pocket_money" }
    );

  const { data: paymentSummary } = trpc.payment.getSummary.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  const feesData =
    feesByStream?.map((s) => ({
      name: s.streamName,
      grade: s.streamGrade,
      total: parseFloat(s.totalFees || "0"),
      count: s.studentCount,
      avg: parseFloat(s.avgFeeBalance || "0"),
    })) || [];

  const pocketData =
    pocketByStream?.map((s) => ({
      name: s.streamName,
      grade: s.streamGrade,
      total: parseFloat(s.totalPocketMoney || "0"),
      count: s.studentCount,
      avg: parseFloat(s.avgPocketMoney || "0"),
    })) || [];

  const chartData = activeTab === "fees" ? feesData : pocketData;
  const isLoading = activeTab === "fees" ? feesLoading : pocketLoading;

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">
            View fees and pocket money by class/stream
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Payments</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatKSH(paymentSummary?.totalPayments)}
                </p>
                <p className="text-xs text-slate-400">
                  {paymentSummary?.paymentCount || 0} transactions
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Fees Collected</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatKSH(paymentSummary?.feesPayments)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pocket Money Received</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatKSH(paymentSummary?.pocketPayments)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab("fees")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "fees"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Fees by Stream
                </div>
              </button>
              <button
                onClick={() => setActiveTab("pocket_money")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "pocket_money"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Pocket Money by Stream
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Chart */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                {activeTab === "fees"
                  ? "Fee Balance by Stream"
                  : "Pocket Money by Stream"}
              </h3>
              {isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value: number) => formatKSH(value)}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-400">
                  No data available
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                      Stream
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                      Grade
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                      Students
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                      Total
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                      Average
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{row.grade}</td>
                      <td className="px-4 py-4 text-sm text-center text-slate-600">
                        {row.count}
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-semibold text-slate-900">
                        {formatKSH(row.total)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-slate-600">
                        {formatKSH(row.avg)}
                      </td>
                    </tr>
                  ))}
                  {chartData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
