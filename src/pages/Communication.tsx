import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import {
  MessageSquare,
  Send,
  Plus,
  History,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function Communication() {
  const { school } = useAuth();
  const schoolId = school?.id;
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<"send" | "history">("send");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [smsType, setSmsType] = useState<
    "bulk" | "fee_reminder" | "other"
  >("bulk");
  const [bulkPhones, setBulkPhones] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const { data: stats } = trpc.sms.getStats.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  const { data: smsLogs, isLoading: logsLoading } = trpc.sms.list.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId && activeTab === "history" }
  );

  const sendMutation = trpc.sms.send.useMutation({
    onSuccess: () => {
      setPhone("");
      setMessage("");
      utils.sms.getStats.invalidate();
      utils.sms.list.invalidate();
      alert("SMS sent successfully!");
    },
    onError: (err) => alert(err.message),
  });

  const sendBulkMutation = trpc.sms.sendBulk.useMutation({
    onSuccess: (data) => {
      setBulkPhones("");
      setMessage("");
      utils.sms.getStats.invalidate();
      utils.sms.list.invalidate();
      alert(`Bulk SMS sent! ${data.sent} sent, ${data.failed} failed.`);
    },
    onError: (err) => alert(err.message),
  });

  const topUpMutation = trpc.sms.topUp.useMutation({
    onSuccess: () => {
      setTopUpAmount("");
      setShowTopUpModal(false);
      utils.sms.getStats.invalidate();
      alert("SMS balance topped up successfully!");
    },
  });

  const handleSendSingle = () => {
    if (!phone || !message || !schoolId) return;
    sendMutation.mutate({
      schoolId,
      phone,
      message,
      type: "other",
    });
  };

  const handleSendBulk = () => {
    if (!bulkPhones || !message || !schoolId) return;
    const phones = bulkPhones
      .split(/[\n,]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (phones.length === 0) return;
    sendBulkMutation.mutate({
      schoolId,
      phones,
      message,
      type: smsType,
    });
  };

  const handleTopUp = () => {
    if (!schoolId || !topUpAmount) return;
    topUpMutation.mutate({
      schoolId,
      amount: parseInt(topUpAmount),
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Communication</h1>
          <p className="text-slate-500 mt-1">
            Send SMS messages and manage your SMS balance
          </p>
        </div>

        {/* SMS Balance Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-50 rounded-2xl">
                <MessageSquare className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">SMS Balance</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats?.smsBalance || 0}
                </p>
                <p className="text-xs text-slate-400">credits remaining</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-500">Total Sent</p>
                <p className="text-lg font-semibold text-slate-900">
                  {stats?.totalSent || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">Successful</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {stats?.sent || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">Failed</p>
                <p className="text-lg font-semibold text-red-600">
                  {stats?.failed || 0}
                </p>
              </div>
              <button
                onClick={() => setShowTopUpModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Top Up
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab("send")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "send"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send SMS
                </div>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  History
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "send" ? (
              <div className="space-y-6">
                {/* SMS Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SMS Type
                  </label>
                  <div className="flex gap-3">
                    {(["bulk", "fee_reminder", "other"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSmsType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          smsType === type
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {type === "bulk"
                          ? "Bulk SMS"
                          : type === "fee_reminder"
                          ? "Fee Reminder"
                          : "Other"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Single or Bulk */}
                {smsType === "bulk" ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Numbers (one per line or comma-separated)
                    </label>
                    <textarea
                      value={bulkPhones}
                      onChange={(e) => setBulkPhones(e.target.value)}
                      placeholder="+254712345678&#10;+254723456789"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {bulkPhones
                        .split(/[\n,]/)
                        .filter((p) => p.trim().length > 0).length}{" "}
                      numbers entered
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254712345678"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message ({message.length}/480 characters)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 480))}
                    placeholder="Enter your message here..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                    maxLength={480}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Each SMS is 160 characters. Longer messages count as multiple.
                  </p>
                </div>

                {/* Send Button */}
                <button
                  onClick={smsType === "bulk" ? handleSendBulk : handleSendSingle}
                  disabled={
                    (!message ||
                      (smsType === "bulk" ? !bulkPhones : !phone) ||
                      sendMutation.isPending ||
                      sendBulkMutation.isPending) &&
                    !(smsType === "bulk"
                      ? bulkPhones && message
                      : phone && message)
                  }
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {sendMutation.isPending || sendBulkMutation.isPending
                    ? "Sending..."
                    : smsType === "bulk"
                    ? "Send Bulk SMS"
                    : "Send SMS"}
                </button>
              </div>
            ) : (
              /* History */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        Type
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        Phone
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        Message
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        Cost
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logsLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
                        </td>
                      </tr>
                    ) : smsLogs && smsLogs.length > 0 ? (
                      smsLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4">
                            {getStatusIcon(log.status)}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                              {log.type}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {log.recipientPhone}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 max-w-xs truncate">
                            {log.message}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-slate-600">
                            {log.cost}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-slate-500">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No SMS history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Top Up SMS</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Current balance:{" "}
              <span className="font-semibold text-slate-900">
                {stats?.smsBalance || 0}
              </span>{" "}
              credits
            </p>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount to add
            </label>
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Enter number of SMS credits"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              min={1}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setTopUpAmount("");
                }}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={!topUpAmount || topUpMutation.isPending}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                {topUpMutation.isPending ? "Processing..." : "Top Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
