import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import {
  GraduationCap,
  ArrowRight,
  CreditCard,
  MessageSquare,
  Wallet,
  BarChart3,
  Shield,
  CheckCircle,
  Building2,
} from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">EduPay</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-colors"
            >
              Register School
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-sm font-medium text-indigo-700 mb-6">
            <Shield className="w-4 h-4" />
            Trusted by Schools Across Kenya
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            School Fee & Pocket Money
            <br />
            <span className="text-indigo-600">Management Made Simple</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            EduPay helps schools manage student fees, pocket money, and parent
            payments all in one place. Integrated with M-Pesa for seamless
            transactions.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-lg"
            >
              Register Your School
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pay"
              className="flex items-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-slate-300 transition-colors text-lg"
            >
              <CreditCard className="w-5 h-5" />
              Pay Fees
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              A complete solution for managing school finances, from fee collection
              to pocket money disbursement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CreditCard,
                title: "M-Pesa Integration",
                description:
                  "Parents pay directly via M-Pesa STK push. Funds go straight to your school's paybill.",
                color: "bg-blue-500",
              },
              {
                icon: Wallet,
                title: "Pocket Money Management",
                description:
                  "Track and disburse pocket money to students with automatic SMS notifications to parents.",
                color: "bg-emerald-500",
              },
              {
                icon: BarChart3,
                title: "Financial Reports",
                description:
                  "Beautiful charts and reports showing fees by stream, payment trends, and balances.",
                color: "bg-violet-500",
              },
              {
                icon: MessageSquare,
                title: "SMS Notifications",
                description:
                  "Send automatic SMS to parents when pocket money is disbursed or fees are received.",
                color: "bg-amber-500",
              },
              {
                icon: Building2,
                title: "Multi-School Support",
                description:
                  "Admin dashboard to manage all registered schools, subscriptions, and analytics.",
                color: "bg-rose-500",
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description:
                  "Built with modern security standards. Your school data is safe and always accessible.",
                color: "bg-cyan-500",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-5`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-slate-500">
              Get started in minutes with these simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Register School",
                description: "Sign up and get your unique school code instantly.",
              },
              {
                step: "02",
                title: "Add Students",
                description: "Upload your student list with parent contacts.",
              },
              {
                step: "03",
                title: "Share Code",
                description: "Give parents your school code for payments.",
              },
              {
                step: "04",
                title: "Track Everything",
                description: "Monitor payments, disburse money, send SMS.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-indigo-600">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-slate-500">
              One flat monthly fee. No hidden charges.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 max-w-md mx-auto text-center">
            <div className="mb-6">
              <span className="text-5xl font-bold text-slate-900">KSH 2,500</span>
              <span className="text-slate-500 ml-2">/month</span>
            </div>
            <ul className="text-left space-y-3 mb-8">
              {[
                "Unlimited students",
                "Unlimited transactions",
                "M-Pesa integration",
                "SMS notifications",
                "Financial reports",
                "Pocket money management",
                "Parent payment portal",
                "Admin dashboard access",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-slate-600">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="block w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">EduPay</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link to="/login" className="hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="hover:text-white transition-colors">
                Register School
              </Link>
              <Link to="/pay" className="hover:text-white transition-colors">
                Pay Fees
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              &copy; 2025 EduPay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
