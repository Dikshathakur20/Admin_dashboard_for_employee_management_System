import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Supabase sends the access_token in URL as ?access_token=...
  const accessToken = searchParams.get("access_token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      return toast({ title: "Error", description: "All fields are required", variant: "destructive" });
    }
    if (newPassword !== confirmPassword) {
      return toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
    }
    if (!accessToken) {
      return toast({ title: "Error", description: "Invalid or expired link", variant: "destructive" });
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      }, accessToken ? { accessToken } : undefined);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Password updated successfully" });
        navigate("/login", { replace: true });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-blue-700 text-3xl font-bold mb-8">Reset Password</h1>

      <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md"
        style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }}>
        
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">Set New Password</CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Enter a new password for your account
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
                className="pl-3 pr-3"
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
                className="pl-3 pr-3"
              />
            </div>

            <div className="flex items-center justify-center mt-6">
              <Button
                type="submit"
                className="w-64 bg-[#001F7A] text-white px-4 py-2 hover:bg-blue-600 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
