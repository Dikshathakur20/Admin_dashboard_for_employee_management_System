import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, signIn, signOut } = useAuth();
  const { toast } = useToast();
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Redirect logged-in user to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(emailOrUsername, password);
      if (error) {
        toast({ title: "Sign In Issue", description: error.message, variant: "destructive", duration: 2000 });
      } else {
        toast({ title: "Welcome", description: "Successfully signed in!", duration: 1500 });
        resetInactivityTimer();
        navigate('/dashboard', { replace: true });
      }
    } catch {
      toast({ title: "Connection Issue", description: "An unexpected issue occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Auto logout after 5 minutes of inactivity
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      toast({ title: "Session Expired", description: "Due to inactivity, please log in again.", variant: "destructive" });
      signOut();
      navigate('/auth', { replace: true });
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
    const handleUnload = () => signOut();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [signOut]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-blue-700 text-3xl font-bold mb-8">Admin Portal</h1>

      <Card
        className="w-full max-w-md shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md"
        style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Login</CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 mt-4">
            {/* Email/Username */}
            <div className="space-y-1">
              <Label htmlFor="email" className="font-medium text-gray-700">Email or Username</Label>
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
                  className="pl-10 bg-white border border-gray-400 shadow-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pl-10 pr-10 bg-white border border-gray-400 shadow-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-purple-400 focus:outline-none"
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

            {/* Sign In Button */}
            <div className="flex justify-center">
            <Button
              type="submit"
              className=" bg-[#001F7A] text-white px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-[#0029b0] transition text-sm"
              title="Click to sign in"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
              </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
