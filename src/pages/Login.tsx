import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/contexts/LoginContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { user, login, logout } = useLogin();
  const { toast } = useToast();
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Redirect logged-in user to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // ----------------------
  // Login Form
  // ----------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await login(emailOrUsername, password);
      if (error) {
        toast({ title: "Login Issue", description: error.message, variant: "destructive", duration: 2000 });
      } else {
        toast({ title: "Welcome", description: "Successfully logged in!", duration: 1500 });
        resetInactivityTimer();
        navigate('/dashboard', { replace: true });
      }
    } catch {
      toast({ title: "Connection Issue", description: "An unexpected issue occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Forgot Password - Direct Password Reset
  // ----------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      return toast({ title: "Error", description: "Enter your email", variant: "destructive" });
    }
    setLoading(true);

    try {
      // Step 1: Check if email exists in tbladmins
      const { data: adminData, error: adminError } = await supabase
        .from("tbladmins")
        .select("email")
        .eq("email", resetEmail)
        .single();

      if (adminError || !adminData) {
        return toast({ title: "Invalid User", description: "No account found with this email", variant: "destructive" });
      }

      // Step 2: Send password reset email via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login` // optional redirect after reset
      });

      if (error) throw error;

      toast({ title: "Success", description: "Password reset email sent! Check your inbox." });

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Inactivity Timer
  // ----------------------
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      toast({ title: "Session Expired", description: "Due to inactivity, please log in again.", variant: "destructive" });
      logout();
      navigate('/login', { replace: true });
    }, 5 * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
    };
  }, []);

  // Logout on tab close
  useEffect(() => {
    const handleUnload = () => logout();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [logout]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-blue-700 text-3xl font-bold mb-8">Admin Portal</h1>

      <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md"
        style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }}>
        
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">{showReset ? "Reset Password" : "Login"}</CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            {showReset ? "Enter your email to reset your password" : "Enter your credentials to access the admin dashboard"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 mt-4">
          {!showReset ? (
            <form onSubmit={handleSubmit}>
              {/* Email/Username */}
              <div className="space-y-1">
                <Label htmlFor="email">Email or Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter email or username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    autoComplete="off"
                    className="pl-10 pr-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                  />
                  {showPassword ? (
                    <EyeOff
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                      size={18}
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <Eye
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                      size={18}
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right mt-2">
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setShowReset(true); 
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              <div className="flex items-center justify-center mt-6">
                <Button
                  type="submit"
                  className="w-64 bg-[#001F7A] text-white px-4 py-2 hover:bg-blue-600 transition-colors"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </div>
            </form>
          ) : (
            // ----------------------
            // Reset Password Form
            // ----------------------
            <form onSubmit={handleResetPassword}>
              <div className="space-y-1">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-center mt-4">
                <Button
                  type="submit"
                  className="w-64 bg-[#001F7A] text-white px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Email"}
                </Button>
              </div>

              <div className="mt-2 text-right">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:underline"
                  onClick={() => setShowReset(false)}
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
