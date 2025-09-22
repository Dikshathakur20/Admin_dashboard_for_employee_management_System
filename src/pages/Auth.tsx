import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock } from 'lucide-react';

const Auth = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const { toast } = useToast();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(emailOrUsername, password);
      if (error) {
        toast({ title: "Sign In Issue", description: error.message, variant: "destructive",duration:2000 });
      } else {
        toast({ title: "Welcome", description: "Successfully signed in to Admin Dashboard!" ,duration:1500 });
      }
    } catch {
      toast({ title: "Connection Issue", description: "An unexpected issue occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 dark:bg-gray-900/80 shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Admin Sign In</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 mt-4">
  <div className="space-y-1">
    <Label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-200">
      Email or Username
    </Label>
    <div className="relative">
      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <Input
        id="email"
        type="text"
        placeholder="Enter email or username"
        value={emailOrUsername}
        onChange={(e) => setEmailOrUsername(e.target.value)}
        required
        autoCapitalize='off'
        className="pl-10 bg-white border border-gray-400 shadow-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />
    </div>
  </div>

  <div className="space-y-1">
    <Label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-200">
      Password
    </Label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <Input
        id="password"
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete='newpassword'
        className="pl-10 bg-white border border-gray-400 shadow-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-purple-400 focus:outline-none"
      />
    </div>
  </div>


<Button
  type="submit"
  className="w-full bg-[#001F7A] text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-[#0029b0] transition disabled:opacity-70 disabled:cursor-not-allowed"
  disabled={loading}
>
  {loading ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    "Sign In"
  )}
</Button>


            
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
