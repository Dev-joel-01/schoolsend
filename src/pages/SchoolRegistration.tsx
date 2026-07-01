import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import {
  GraduationCap,
  CheckCircle,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  CreditCard,
  MapPin,
} from "lucide-react";

export default function SchoolRegistration() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [schoolCode, setSchoolCode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paybillNumber: "",
    accountNumber: "",
    contactPerson: "",
    contactPhone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = trpc.school.register.useMutation({
    onSuccess: (data) => {
      setSchoolCode(data.code);
      setStep("success");
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "School name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.paybillNumber.trim())
      newErrors.paybillNumber = "Paybill number is required";
    if (!formData.accountNumber.trim())
      newErrors.accountNumber = "Account number is required";
    if (!formData.contactPerson.trim())
      newErrors.contactPerson = "Contact person is required";
    if (!formData.contactPhone.trim())
      newErrors.contactPhone = "Contact phone is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    registerMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Registration Successful!
          </h1>
          <p className="text-slate-500 mb-6">
            Your school has been registered. Your school code has been sent to your
            email.
          </p>

          <div className="bg-indigo-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-indigo-600 mb-2">Your School Code</p>
            <p className="text-3xl font-mono font-bold text-indigo-900">
              {schoolCode}
            </p>
            <p className="text-xs text-indigo-500 mt-2">
              Share this code with parents for payments
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-medium text-amber-800 mb-1">Next Steps:</p>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Save your school code safely</li>
              <li>Login to access your dashboard</li>
              <li>Activate your subscription (KSH 2,500/month)</li>
              <li>Add your students and classes</li>
              <li>Share the code with parents</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Link
              to="/login"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Login to Dashboard
            </Link>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">EduPay</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Register Your School
          </h1>
          <p className="text-slate-500 mt-2">
            Join EduPay to manage fees and pocket money digitally
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* School Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  School Name
                </div>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Greenfield Academy"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.name ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  School Email
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@school.edu"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.email ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  School Phone
                </div>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+254712345678"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.phone ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Address (Optional)
                </div>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="School physical address"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
              />
            </div>

            {/* Paybill Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  M-Pesa Paybill Number
                </div>
              </label>
              <input
                type="text"
                name="paybillNumber"
                value={formData.paybillNumber}
                onChange={handleChange}
                placeholder="e.g., 522522"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.paybillNumber ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.paybillNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.paybillNumber}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  Account Number
                </div>
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="e.g., School Name"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.accountNumber ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.accountNumber}
                </p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Contact Person
                </div>
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="e.g., Mr. John Kamau"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.contactPerson ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.contactPerson && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contactPerson}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Contact Phone
                </div>
              </label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="+254712345678"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.contactPhone ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.contactPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contactPhone}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full mt-8 px-6 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {registerMutation.isPending
              ? "Registering..."
              : "Complete Registration (KSH 2,500/month)"}
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            By registering, you agree to the KSH 2,500 monthly subscription fee.
          </p>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
