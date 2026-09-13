import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  Sparkles,
  Zap,
  Radio,
  ArrowRight
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('abhishek');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [operatorRole, setOperatorRole] = useState('meteorologist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Instant client-side mock authentication for hackathon demo (no backend auth required)
    setTimeout(() => {
      const demoUser = {
        username: username || 'abhishek',
        full_name: fullName || (username === 'abhishek' ? 'Abhishek (Admin)' : (username === 'observer' ? 'Field Observer' : username)),
        role: username === 'abhishek' ? 'admin' : (operatorRole || 'meteorologist'),
      };
      localStorage.setItem('aws_token', 'demo_jwt_token_valid');
      onAuthSuccess(demoUser);
      setLoading(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 sm:p-7 relative shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5 overflow-hidden">
        {/* Subtle Decorative Ambient Background Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-sky-500/15 dark:bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Brand Logo */}
        <div className="flex flex-col items-center text-center gap-2 pt-1">
          <BrandLogo size={46} className="mb-1" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Clima<span className="text-sky-500 font-black">Sense</span>
            </span>
            <span className="text-[0.65rem] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              Station Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">
            Climate + intelligent sensing
          </p>
        </div>

        {/* 1-Click Quick Demo Fill Pills */}
        {!isRegister && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[0.7rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Demo Operator Sign In
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('abhishek', 'admin123')}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-xs transition text-left cursor-pointer group"
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>👨‍💻 Administrator</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-sky-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="text-[0.68rem] text-slate-400 font-mono mt-0.5">abhishek / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('observer', 'obs123')}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xs transition text-left cursor-pointer group"
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>🔬 Field Observer</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="text-[0.68rem] text-slate-400 font-mono mt-0.5">observer / obs123</div>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isRegister && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Operator Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                    placeholder="e.g. Abhishek Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Operator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                    placeholder="operator@metpulse-aws.org"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Operational Role
                </label>
                <select
                  value={operatorRole}
                  onChange={(e) => setOperatorRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white cursor-pointer"
                >
                  <option value="meteorologist">Chief Surface Meteorologist</option>
                  <option value="engineer">AWS Station Hardware Engineer</option>
                  <option value="analyst">Quality Control & AI Analyst</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white font-mono"
                placeholder="Username"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isRegister && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-sky-600 rounded cursor-pointer"
                />
                <span>Remember session (24h)</span>
              </label>

              <span className="text-[0.7rem] font-mono text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" /> JWT Protected
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Operator...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>{isRegister ? 'Complete Operator Registration' : 'Sign In to Station Network'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle between Login / Register */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
          >
            {isRegister
              ? 'Already have verified operator credentials? Sign In'
              : 'Need new station technician access? Register Operator'}
          </button>
        </div>
      </div>
    </div>
  );
}
