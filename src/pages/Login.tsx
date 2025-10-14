// Login.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/contexts/LoginContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false); // toggle forgot password form
  const [showSignup, setShowSignup] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { login, logout, user } = useLogin();
  const { toast } = useToast();
  const inactivityTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  // Navigate to dashboard if user exists
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // Signup (New Admin)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailOrUsername,
        password,
      });
      if (error) throw error;

      const { error: dbError } = await supabase.from('tbladmins').insert([
        { email: emailOrUsername, password, user_name: emailOrUsername, role: 'admin' },
      ]);
      if (dbError) throw dbError;

      toast({ title: 'Signup Success', description: 'Account created. Check your email for verification link.' });
      setShowSignup(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Login Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tbladmins')
        .select('*')
        .eq('email', emailOrUsername)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('Admin not found');
      if (data.password !== password) throw new Error('Incorrect password');

      toast({ title: 'Login Success', description: `Welcome ${data.user_name || 'Admin'}` });
      localStorage.setItem('admin_id', data.id);
      localStorage.setItem('admin_role', data.role || 'admin');
      await login(data.email, password);
    } catch (err: any) {
      toast({ title: 'Login Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!resetEmail) {
      toast({ title: 'Error', description: 'Enter your email', variant: 'destructive' });
      setLoading(false);
      return;
    }

    try {
      // Check if email exists in tbladmins
      const { data } = await supabase
        .from('tbladmins')
        .select('email')
        .eq('email', resetEmail)
        .maybeSingle();

      if (!data) {
        toast({ title: 'Error', description: 'This account is not registered.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Send reset email using Supabase auth
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'http://localhost:8080/new-password', // adjust as needed
      });
      if (error) throw error;

      toast({ title: 'Success', description: 'Check your inbox for the reset link!' });
      setResetEmail('');
      setShowReset(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Inactivity Timer
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = window.setTimeout(() => {
      toast({ title: 'Session Expired', description: 'Due to inactivity, please log in again.', variant: 'destructive' });
      logout();
    }, 5 * 60 * 1000);
  };
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
    };
  }, []);

  // UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-blue-700 text-3xl font-bold mb-8">Admin Portal</h1>

      <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md" style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">{showReset ? 'Reset Password' : showSignup ? 'Sign Up' : 'Login'}</CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            {showReset ? 'Enter your email to receive reset link.' : showSignup ? 'Create an admin account.' : 'Enter your credentials to access the admin dashboard.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 mt-4">
          {showReset ? (
            <form onSubmit={handleResetPassword}>
              <Label>Email</Label>
              

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10" // add padding-right to avoid overlap with the icon
                  placeholder="Enter your password"
                />
              
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
              </div>

              <div className="flex items-center justify-center mt-4">
                <Button type="submit" disabled={loading} className="w-64 bg-[#001F7A] text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Email'}
                </Button>
              </div>
              <div className="mt-2 text-right">
                <a href="#" onClick={(e) => { e.preventDefault(); setShowReset(false); }} className="text-sm text-gray-600 hover:underline">Back to Login</a>
              </div>
            </form>
          ) : showSignup ? (
            <form onSubmit={handleSignup}>
              <Label>Email</Label>
              <Input type="email" value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} required />
              <Label>Password</Label>
              

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10" // add padding-right to avoid overlap with the icon
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
              </div>
              <div className="flex items-center justify-center mt-6">
                <Button type="submit" disabled={loading} className="w-64 bg-[#001F7A] text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
              </div>
              <div className="mt-2 text-center">
                <a href="#" onClick={(e) => { e.preventDefault(); setShowSignup(false); }} className="text-sm text-blue-600 hover:underline">Back to Login</a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <Label>Email</Label>
              <Input type="email" value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} required />
              <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10" // add padding-right to avoid overlap with the icon
                      placeholder="Enter your password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={10} /> : <Eye size={10} />}
                    </button>
                  </div>

              <div className="flex items-center justify-center mt-6">
                <Button type="submit" disabled={loading} className="w-64 bg-[#001F7A] text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                </Button>
              </div>
              <div className="mt-3 text-center flex flex-col gap-2">
                <a href="#" onClick={(e) => { e.preventDefault(); setShowSignup(true); }} className="text-sm text-gray-600 hover:underline">Don’t have an account? Sign Up</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowReset(true); }} className="text-sm text-blue-600 hover:underline">Forgot Password?</a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
