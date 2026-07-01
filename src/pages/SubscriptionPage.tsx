import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { formatKSH, formatDate, getDaysUntil } from "@/lib/utils";
import {
  Receipt,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  CreditCard,
  Shield,
} from "lucide-react";

export default function SubscriptionPage() {
  const { school } = useAuth();
  const schoolId = school?.id;
  const utils = trpc.useUtils();

  const { data: schoolData } = trpc.school.getById.useQuery(
    { id: schoolId! },
    { enabled: !!schoolId }
  );

  const renewMutation = trpc.school.renewSubscription.useMutation({
    onSuccess: () => {
      utils.school.getById.invalidate();
      utils.school.getMySchool.invalidate();
      utils.dashboard.getSchoolDashboard.invalidate();
      alert("Subscription renewed successfully!");
    },
  });

  if (!schoolData) {
    return (
      <Sidebar>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Sidebar>
    );
  }

  const daysLeft = getDaysUntil(schoolData.subscriptionEndDate);
  const isExpiringSoon = daysLeft <= 7;
  const isActive = schoolData.subscriptionStatus === "active";

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
          <p className="text-slate-500 mt-1">
            Manage your monthly subscription plan
          </p>
        </div>

        {/* Status Card */}
        <div
          className={`rounded-2xl p-6 border shadow-sm mb-8 ${
            isActive
              ? isExpiringSoon
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${
                isActive
                  ? isExpiringSoon
                    ? "bg-amber-100"
                    : "bg-emerald-100"
                  : "bg-red-100"
              }`}
            >
              {isActive ? (
                isExpiringSoon ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                )
              ) : (
                <Clock className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                Subscription Status:{" "}
                <span
                  className={`capitalize ${
                    isActive
                      ? isExpiringSoon
                        ? "text-amber-700"
                        : "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {schoolData.subscriptionStatus}
                </span>
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {isActive
                  ? isExpiringSoon
                    ? `Your subscription expires in ${daysLeft} days. Renew now to avoid interruption.`
                    : `Your subscription is active. ${daysLeft} days remaining.`
                  : "Your subscription has expired. Please renew to continue using the service."}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Plan Details</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">Plan</span>
              </div>
              <span className="font-semibold text-slate-900">Monthly Subscription</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">Amount</span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatKSH(schoolData.subscriptionAmount)}/month
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">Start Date</span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatDate(schoolData.subscriptionStartDate)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">End Date</span>
              </div>
              <span
                className={`font-semibold ${
                  isExpiringSoon ? "text-amber-600" : "text-slate-900"
                }`}
              >
                {formatDate(schoolData.subscriptionEndDate)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">Days Remaining</span>
              </div>
              <span
                className={`font-semibold ${
                  isExpiringSoon ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {daysLeft} days
              </span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">What's Included</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Student Management",
                "Fee & Pocket Money Tracking",
                "M-Pesa Payment Integration",
                "SMS Notifications",
                "Disbursement Management",
                "Financial Reports & Charts",
                "Unlimited Transactions",
                "Parent Payment Portal",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Renewal CTA */}
        <div className="bg-indigo-600 rounded-2xl p-8 text-center text-white">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h3 className="text-xl font-bold mb-2">Keep Your School Running</h3>
          <p className="text-indigo-200 mb-6">
            Renew your subscription to ensure uninterrupted access to all features.
          </p>
          <button
            onClick={() => {
              if (confirm(`Renew subscription for ${formatKSH(schoolData.subscriptionAmount)}?`)) {
                renewMutation.mutate({ schoolId: schoolId! });
              }
            }}
            disabled={renewMutation.isPending}
            className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 disabled:opacity-50 transition-colors"
          >
            {renewMutation.isPending
              ? "Processing..."
              : `Renew for ${formatKSH(schoolData.subscriptionAmount)}`}
          </button>
        </div>
      </div>
    </Sidebar>
  );
}
