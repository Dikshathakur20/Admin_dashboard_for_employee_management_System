import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function NewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // -------------------------
  // 1️⃣ Hook: Extract tokens from URL
  // -------------------------
  useEffect(() => {
    const access_token = searchParams.get("access_token");
    const refresh_token = searchParams.get("refresh_token"); // optional, if you send it
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
  }, [searchParams]);

  // -------------------------
  // 2️⃣ Hook: Validate token presence
  // -------------------------
  useEffect(() => {
    if (accessToken === null) return; // wait until extracted

    if (!accessToken) {
      toast({
        title: "Error",
        description: "Invalid or expired reset link.",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
    } else {
      setTokenValid(true);
    }
  }, [accessToken, navigate, toast]);

  // -------------------------
  // Handle password reset with refresh token
  // -------------------------
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken) {
      toast({
        title: "Error",
        description: "Token is missing, cannot reset password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ Exchange access token for session
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "", // fallback if you don’t send it
      });

      if (sessionError) throw sessionError;

      // ✅ Now update password with active session
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Password updated successfully! Please log in.",
      });
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md shadow-xl rounded-3xl border border-gray-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Reset Password
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Enter your new password to complete the reset.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handlePasswordReset}
            className="space-y-4 mt-4"
            disabled={!tokenValid}
          >
            <div className="relative">
              <Label>New Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 cursor-pointer text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            <div className="relative">
              <Label>Confirm Password</Label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 cursor-pointer text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#001F7A] text-white"
              disabled={!tokenValid || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
