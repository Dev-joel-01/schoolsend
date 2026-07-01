import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { formatKSH, formatDate, getDaysUntil } from "@/lib/utils";
import {
  Users,
  CreditCard,
  Wallet,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  GraduationCap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  subtitle?: string;
  trend?: "up" | "down";
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${
              trend === "up" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? "Increasing" : "Decreasing"}
          </span>
        </div>
      )}
    </div>
  );
}

export default function SchoolDashboard() {
  const { school } = useAuth();
  const schoolId = school?.id;

  const { data: dashboard, isLoading } = trpc.dashboard.getSchoolDashboard.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  if (isLoading) {
    return (
      <Sidebar>
        <div className="p-8 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </Sidebar>
    );
  }

  if (!dashboard) {
    return (
      <Sidebar>
        <div className="p-8 text-center">
          <p className="text-slate-500">No data available. Please register your school.</p>
        </div>
      </Sidebar>
    );
  }

  const { stats, streamWithHighestFees, topFeeBalances, recentPayments, paymentsByMonth } = dashboard;

  const chartData = paymentsByMonth?.map((p) => ({
    month: p.month,
    fees: parseFloat(p.fees || "0"),
    pocketMoney: parseFloat(p.pocketMoney || "0"),
  })) || [];

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back! Here's what's happening at {school?.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Students"
            value={stats.totalStudents.toString()}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions.toString()}
            icon={CreditCard}
            color="bg-emerald-500"
          />
          <StatCard
            title="Pocket Money Received"
            value={formatKSH(stats.pocketMoneyReceived)}
            icon={Wallet}
            color="bg-violet-500"
          />
          <StatCard
            title="Fees Received"
            value={formatKSH(stats.feesReceived)}
            icon={TrendingUp}
            color="bg-amber-500"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Subscription Renewal</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatDate(stats.subscriptionEndDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    getDaysUntil(stats.subscriptionEndDate) <= 7
                      ? "bg-red-500 w-3/4"
                      : "bg-emerald-500 w-full"
                  }`}
                />
              </div>
              <span className="text-xs font-medium text-slate-500">
                {getDaysUntil(stats.subscriptionEndDate)} days left
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">SMS Balance</p>
                <p className="text-2xl font-bold text-slate-900">{stats.smsBalance}</p>
                <p className="text-xs text-slate-400">credits remaining</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <GraduationCap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Fee Balance (All Students)</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatKSH(stats.totalFeeBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Trends */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Payment Trends
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => formatKSH(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="fees"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1" }}
                    name="Fees"
                  />
                  <Line
                    type="monotone"
                    dataKey="pocketMoney"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                    name="Pocket Money"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No payment data yet
              </div>
            )}
          </div>

          {/* Stream with Highest Fees */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Highest Fee Balance Stream
            </h3>
            {streamWithHighestFees ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-700">
                      {streamWithHighestFees.streamName} ({streamWithHighestFees.streamGrade})
                    </p>
                    <p className="text-sm text-red-600">
                      Total Balance: {formatKSH(streamWithHighestFees.totalBalance)} •{" "}
                      {streamWithHighestFees.studentCount} students
                    </p>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: streamWithHighestFees.streamName,
                          balance: parseFloat(streamWithHighestFees.totalBalance),
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatKSH(value)} />
                      <Bar dataKey="balance" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">
                No stream data
              </div>
            )}
          </div>
        </div>

        {/* Top 10 Students with Highest Fee Balances */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">
              Top 10 Students with Highest Fee Balances
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Students with outstanding fee payments
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Student
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Admission No.
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Stream
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Parent
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Fee Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topFeeBalances?.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-700">
                            {student.firstName.charAt(0)}
                            {student.lastName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {student.firstName} {student.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.streamName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.parentName}
                      <br />
                      <span className="text-xs text-slate-400">{student.parentPhone}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-red-600">
                        {formatKSH(student.feeBalance)}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!topFeeBalances || topFeeBalances.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No students with fee balances
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Recent Payments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Type
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Student
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments?.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.type === "fees"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {payment.type === "fees" ? "Fees" : "Pocket Money"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {payment.studentFirstName} {payment.studentLastName}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                      {formatKSH(payment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : payment.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {payment.mpesaReceipt || "—"}
                    </td>
                  </tr>
                ))}
                {(!recentPayments || recentPayments.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No payments yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
