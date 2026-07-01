import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import { formatKSH } from "@/lib/utils";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  User,
  School,
  Users,
  Wallet,
  BookOpen,
} from "lucide-react";

type Step =
  | "school-code"
  | "select-stream"
  | "select-student"
  | "payment-type"
  | "enter-amount"
  | "confirm"
  | "success";

export default function ParentPayment() {
  const [step, setStep] = useState<Step>("school-code");
  const [schoolCode, setSchoolCode] = useState("");
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<"fees" | "pocket_money" | null>(null);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [checkoutId, setCheckoutId] = useState("");

  const { data: schoolData, isLoading: schoolLoading } =
    trpc.parent.verifySchoolCode.useQuery(
      { code: schoolCode },
      { enabled: step === "select-stream" && !!schoolCode }
    );

  const { data: streams } = trpc.parent.getStreams.useQuery(
    { schoolId: schoolData?.school?.id! },
    { enabled: !!schoolData?.school?.id && step === "select-stream" }
  );

  const { data: students } = trpc.parent.getStudentsByStream.useQuery(
    { streamId: selectedStreamId! },
    { enabled: !!selectedStreamId && step === "select-student" }
  );

  const { data: studentData } = trpc.parent.getStudentForPayment.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId && step === "payment-type" }
  );

  const stkMutation = trpc.mpesa.initiateStkPush.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setCheckoutId(data.checkoutRequestId || "");
        setStep("success");
      } else {
        alert(data.error || "Payment initiation failed");
      }
    },
    onError: (err) => alert(err.message),
  });

  const handleNext = () => {
    switch (step) {
      case "school-code":
        if (schoolCode.trim()) setStep("select-stream");
        break;
      case "select-stream":
        if (selectedStreamId) setStep("select-student");
        break;
      case "select-student":
        if (selectedStudentId) setStep("payment-type");
        break;
      case "payment-type":
        if (paymentType) setStep("enter-amount");
        break;
      case "enter-amount":
        if (amount && phoneNumber) setStep("confirm");
        break;
      case "confirm":
        if (
          schoolData?.school?.id &&
          selectedStudentId &&
          paymentType &&
          amount &&
          phoneNumber
        ) {
          stkMutation.mutate({
            schoolId: schoolData.school.id,
            studentId: selectedStudentId,
            paymentType,
            amount: parseFloat(amount),
            phoneNumber,
            accountReference: schoolData.school.code,
            transactionDesc: `${paymentType} payment for ${studentData?.firstName || "student"}`,
          });
        }
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "select-stream":
        setStep("school-code");
        break;
      case "select-student":
        setStep("select-stream");
        setSelectedStreamId(null);
        break;
      case "payment-type":
        setStep("select-student");
        setSelectedStudentId(null);
        break;
      case "enter-amount":
        setStep("payment-type");
        setPaymentType(null);
        break;
      case "confirm":
        setStep("enter-amount");
        break;
    }
  };

  const canProceed = () => {
    switch (step) {
      case "school-code":
        return schoolCode.trim().length > 0;
      case "select-stream":
        return selectedStreamId !== null;
      case "select-student":
        return selectedStudentId !== null;
      case "payment-type":
        return paymentType !== null;
      case "enter-amount":
        return (
          amount.length > 0 &&
          parseFloat(amount) > 0 &&
          phoneNumber.length >= 10
        );
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const stepTitle = () => {
    switch (step) {
      case "school-code":
        return "Enter School Code";
      case "select-stream":
        return "Select Class/Stream";
      case "select-student":
        return "Select Student";
      case "payment-type":
        return "Select Payment Type";
      case "enter-amount":
        return "Enter Amount";
      case "confirm":
        return "Confirm Payment";
      case "success":
        return "Payment Initiated!";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">EduPay</span>
          </Link>
          <span className="text-sm text-slate-500">Parent Payment</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        {step !== "success" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[
                "school-code",
                "select-stream",
                "select-student",
                "payment-type",
                "enter-amount",
                "confirm",
              ].map((s, i) => {
                const currentIdx = [
                  "school-code",
                  "select-stream",
                  "select-student",
                  "payment-type",
                  "enter-amount",
                  "confirm",
                ].indexOf(step);
                const isActive = i <= currentIdx;
                return (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < 5 && (
                      <div
                        className={`w-8 h-0.5 ${
                          i < currentIdx ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-4">
              {stepTitle()}
            </h1>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {/* School Code Step */}
          {step === "school-code" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <School className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-slate-500">
                  Enter the school code provided by your child's school
                </p>
              </div>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) =>
                  setSchoolCode(e.target.value.toUpperCase())
                }
                placeholder="e.g., SCH1A2B3C"
                className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg font-mono uppercase"
              />
            </div>
          )}

          {/* Select Stream */}
          {step === "select-stream" && (
            <div className="space-y-3">
              {schoolLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : !schoolData?.valid ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{schoolData?.message}</p>
                  <button
                    onClick={handleBack}
                    className="mt-4 text-indigo-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-indigo-600">
                      School: <strong>{schoolData.school?.name}</strong>
                    </p>
                  </div>
                  {streams?.map((stream) => (
                    <button
                      key={stream.id}
                      onClick={() => setSelectedStreamId(stream.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedStreamId === stream.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-slate-900">
                          {stream.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {stream.grade}
                        </p>
                      </div>
                      {selectedStreamId === stream.id && (
                        <CheckCircle className="w-5 h-5 text-indigo-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Select Student */}
          {step === "select-student" && (
            <div className="space-y-3">
              {students?.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selectedStudentId === student.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {student.admissionNumber}
                    </p>
                  </div>
                  {selectedStudentId === student.id && (
                    <CheckCircle className="w-5 h-5 text-indigo-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Payment Type */}
          {step === "payment-type" && studentData && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600">
                  Paying for:{" "}
                  <strong>
                    {studentData.firstName} {studentData.lastName}
                  </strong>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {studentData.admissionNumber} • {studentData.streamName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentType("fees")}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    paymentType === "fees"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <BookOpen
                    className={`w-8 h-8 mx-auto mb-3 ${
                      paymentType === "fees"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  />
                  <p className="font-medium text-slate-900">School Fees</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Current Balance:{" "}
                    <span className="font-semibold text-red-600">
                      {formatKSH(studentData.feeBalance)}
                    </span>
                  </p>
                </button>

                <button
                  onClick={() => setPaymentType("pocket_money")}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    paymentType === "pocket_money"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <Wallet
                    className={`w-8 h-8 mx-auto mb-3 ${
                      paymentType === "pocket_money"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  />
                  <p className="font-medium text-slate-900">Pocket Money</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Current Balance:{" "}
                    <span className="font-semibold text-emerald-600">
                      {formatKSH(studentData.pocketMoneyBalance)}
                    </span>
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Enter Amount */}
          {step === "enter-amount" && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600">
                  Paying:{" "}
                  <strong>
                    {paymentType === "fees" ? "School Fees" : "Pocket Money"}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (KSH)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={1}
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your M-Pesa Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="254712345678"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  You'll receive an STK push on this number
                </p>
              </div>
            </div>
          )}

          {/* Confirm */}
          {step === "confirm" && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Confirm Payment
                </h2>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">School</span>
                  <span className="font-medium text-slate-900">
                    {schoolData?.school?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student</span>
                  <span className="font-medium text-slate-900">
                    {studentData?.firstName} {studentData?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-900 capitalize">
                    {paymentType?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium text-slate-900">
                    {phoneNumber}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between">
                  <span className="text-slate-700 font-medium">Amount</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatKSH(amount)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                You'll receive an M-Pesa STK push on your phone to complete the
                payment.
              </p>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Payment Initiated!
                </h2>
                <p className="text-slate-500 mt-2">
                  Check your phone for the M-Pesa STK push and enter your PIN to
                  complete the payment.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 inline-block">
                <p className="text-sm text-slate-500">Transaction Reference</p>
                <p className="text-lg font-mono font-bold text-slate-900">
                  {checkoutId}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Link
                  to="/"
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Done
                </Link>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step !== "success" && (
            <div className="flex gap-3 mt-8">
              {step !== "school-code" && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed() || stkMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {step === "confirm"
                  ? stkMutation.isPending
                    ? "Processing..."
                    : "Pay Now"
                  : "Continue"}
                {step !== "confirm" && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
