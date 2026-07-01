import { Link } from "react-router";
import {
  GraduationCap,
  ArrowRight,
  Shield,
  User,
} from "lucide-react";

function getOAuthUrl() {
  const authUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${authUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-900">EduPay</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2">
            Login to access your school dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          {/* OAuth Login */}
          <a
            href={getOAuthUrl()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <User className="w-5 h-5" />
            Login with EduPay Account
          </a>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400">
                or
              </span>
            </div>
          </div>

          {/* Admin Login Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Admin Access
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Admin users have full access to manage all schools on the
                  platform. Use your admin account to login.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Register */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1"
            >
              Register your school
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>

        {/* Parent Payment Link */}
        <div className="mt-4 text-center">
          <Link
            to="/pay"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Are you a parent? Make a payment here
          </Link>
        </div>
      </div>
    </div>
  );
}
