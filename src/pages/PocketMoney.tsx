import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { formatKSH } from "@/lib/utils";
import {
  Wallet,
  Send,
  CheckCircle,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface StudentData {
  id: number;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  pocketMoneyBalance: string;
  parentName: string;
  parentPhone: string;
}

interface StreamGroup {
  streamId: number;
  streamName: string | null;
  streamGrade: string | null;
  totalPocketMoney: string;
  studentCount: number;
  students: StudentData[];
}

export default function PocketMoney() {
  const { school } = useAuth();
  const schoolId = school?.id;
  const utils = trpc.useUtils();

  const [expandedStream, setExpandedStream] = useState<number | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [showSmsModal, setShowSmsModal] = useState(false);

  const { data: streamData, isLoading } =
    trpc.disbursement.getPocketMoneyPerStream.useQuery(
      { schoolId: schoolId! },
      { enabled: !!schoolId }
    );

  const { data: summary } = trpc.disbursement.getSummary.useQuery(
    { schoolId: schoolId! },
    { enabled: !!schoolId }
  );

  const disburseMutation = trpc.disbursement.create.useMutation({
    onSuccess: () => {
      utils.disbursement.getPocketMoneyPerStream.invalidate();
      utils.disbursement.getSummary.invalidate();
      utils.dashboard.getSchoolDashboard.invalidate();
      setShowDisburseModal(false);
      setDisburseAmount("");
      setSelectedStudent(null);

      // Show SMS confirmation
      if (selectedStudent) {
        const msg = `Dear ${selectedStudent.parentName}, your child ${selectedStudent.firstName} ${selectedStudent.lastName} has received pocket money of ${formatKSH(disburseAmount)} from ${school?.name}. Thank you.`;
        setSmsMessage(msg);
        setShowSmsModal(true);
      }
    },
  });

  const sendSmsMutation = trpc.sms.send.useMutation({
    onSuccess: () => {
      setShowSmsModal(false);
      setSmsMessage("");
    },
  });

  const handleDisburse = (student: StudentData) => {
    setSelectedStudent(student);
    setDisburseAmount("");
    setShowDisburseModal(true);
  };

  const confirmDisburse = () => {
    if (!selectedStudent || !disburseAmount || !schoolId) return;
    const amount = parseFloat(disburseAmount);
    if (amount <= 0) return;
    if (amount > parseFloat(selectedStudent.pocketMoneyBalance)) {
      alert("Amount exceeds student's pocket money balance");
      return;
    }

    disburseMutation.mutate({
      schoolId,
      studentId: selectedStudent.id,
      amount: disburseAmount,
    });
  };

  const handleSendSMS = () => {
    if (!selectedStudent || !schoolId || !smsMessage) return;
    sendSmsMutation.mutate({
      schoolId,
      phone: selectedStudent.parentPhone,
      message: smsMessage,
      type: "disbursement",
    });
  };

  const streams: StreamGroup[] = (streamData || []).map((s) => ({
    ...s,
    students: JSON.parse(s.students || "[]"),
  }));

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Pocket Money</h1>
          <p className="text-slate-500 mt-1">
            Manage and disburse pocket money to students
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Disbursed</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatKSH(summary?.totalDisbursed)}
                </p>
                <p className="text-xs text-slate-400">
                  {summary?.disburseCount || 0} disbursements
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Pocket Money Balance</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatKSH(
                    streams.reduce(
                      (acc, s) => acc + parseFloat(s.totalPocketMoney || "0"),
                      0
                    )
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  Across {streams.reduce((acc, s) => acc + s.studentCount, 0)} students
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Streams */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {streams.map((stream) => (
              <div
                key={stream.streamId}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Stream Header */}
                <button
                  onClick={() =>
                    setExpandedStream(
                      expandedStream === stream.streamId ? null : stream.streamId
                    )
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-700">
                        {(stream.streamName || "?").charAt((stream.streamName || "").length - 1)}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900">
                        {stream.streamName || "Unknown"} ({stream.streamGrade || ""})
                      </p>
                      <p className="text-sm text-slate-500">
                        {stream.studentCount} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatKSH(stream.totalPocketMoney)}
                      </p>
                      <p className="text-xs text-slate-400">total balance</p>
                    </div>
                    {expandedStream === stream.streamId ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Students List */}
                {expandedStream === stream.streamId && (
                  <div className="border-t border-slate-100">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                              Student
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                              Parent
                            </th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                              Balance
                            </th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stream.students?.map((student: StudentData) => (
                            <tr key={student.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {student.firstName} {student.lastName}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {student.admissionNumber}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {student.parentName}
                                <br />
                                <span className="text-xs text-slate-400">
                                  {student.parentPhone}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-semibold text-emerald-600">
                                  {formatKSH(student.pocketMoneyBalance)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDisburse(student)}
                                  disabled={
                                    parseFloat(student.pocketMoneyBalance) <= 0
                                  }
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Disburse
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {streams.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">No streams found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disburse Modal */}
      {showDisburseModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Disburse Pocket Money
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Parent: {selectedStudent.parentName}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Available Balance:{" "}
                <span className="font-bold text-emerald-600">
                  {formatKSH(selectedStudent.pocketMoneyBalance)}
                </span>
              </p>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount to Disburse (KSH)
            </label>
            <input
              type="number"
              value={disburseAmount}
              onChange={(e) => setDisburseAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              max={parseFloat(selectedStudent.pocketMoneyBalance)}
              min={1}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisburseModal(false);
                  setSelectedStudent(null);
                }}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisburse}
                disabled={!disburseAmount || disburseMutation.isPending}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {disburseMutation.isPending ? "Processing..." : "Confirm Disburse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Confirmation Modal */}
      {showSmsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Disbursement Successful!
                </h3>
                <p className="text-sm text-slate-500">
                  Send SMS notification to parent?
                </p>
              </div>
            </div>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 text-sm"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSmsModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSendSMS}
                disabled={sendSmsMutation.isPending}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sendSmsMutation.isPending ? "Sending..." : "Send SMS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
