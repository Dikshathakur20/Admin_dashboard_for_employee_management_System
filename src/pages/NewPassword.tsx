import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const NewPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get token from query or fallback to hash
  let token = searchParams.get('access_token');
  if (!token && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    token = hashParams.get('access_token');
  }

  useEffect(() => {
    if (!token) setMessage('Invalid or expired link');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }
    if (!token) {
      setMessage('Invalid token');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage(error.message);
    else {
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-blue-700 text-3xl font-bold mb-8">Set New Password</h1>

      <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md"
        style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">New Password</CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 mt-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-center mt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-64 bg-[#001F7A] text-white px-4 py-2 hover:bg-blue-600 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
              </Button>
            </div>

            
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPassword;
