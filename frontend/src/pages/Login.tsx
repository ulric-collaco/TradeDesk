import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e: typeof errors = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = 'Valid email required';
    if (!password) e.password = 'Password required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const ok = await login(email, password);
    if (ok) navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-terminal-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="font-mono text-amber tracking-[0.2em] text-lg font-semibold">
            TRADEDESK
          </h1>
          <div className="h-px bg-terminal-border mt-4" />
        </div>

        <div className="bg-terminal-panel border border-terminal-border rounded p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="trader@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-xs text-status-rejected">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-status-rejected">{errors.password}</p>}
            </div>

            <Button
              id="login-submit"
              variant="amber"
              type="submit"
              loading={loading}
              className="w-full h-11 mt-1"
            >
              Log In
            </Button>
          </form>

          <div className="mt-5 p-3 border border-terminal-border/50 rounded bg-terminal-base/50 text-xs text-text-muted flex flex-col items-center gap-1">
            <span className="font-medium text-text-secondary mb-0.5">Test Admin Account</span>
            <button 
              type="button"
              onClick={() => { setEmail('admin@tradedesk.dev'); setPassword('password123'); }}
              className="hover:text-amber transition-colors font-mono tracking-tight"
            >
              admin@tradedesk.dev
            </button>
            <span className="font-mono tracking-tight cursor-default">password123</span>
          </div>

          <p className="text-center text-sm text-text-muted mt-6">
            No account?{' '}
            <Link to="/register" className="text-amber hover:underline">
              Register →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
