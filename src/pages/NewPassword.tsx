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
  // -------------------------
  // State variables
  // -------------------------
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // -------------------------
  // 1️⃣ Hook: Extract token from URL
  // -------------------------
  useEffect(() => {
    // Prefer hash fragment (Supabase default)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokenFromHash = hashParams.get("access_token");

    // Fallback to query param if necessary
    const tokenFromQuery = searchParams.get("access_token");

    const token = tokenFromHash || tokenFromQuery;
    setAccessToken(token);
    setParamsLoaded(true);
  }, [searchParams]);

  // -------------------------
  // 2️⃣ Hook: Validate token presence
  // -------------------------
  useEffect(() => {
    if (!paramsLoaded) return; // wait until URL params are loaded
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Invalid or expired password reset link.",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
      return;
    }

    // -------------------------
    // 3️⃣ Create temporary session with access_token
    // -------------------------
    supabase.auth
      .setSession({ access_token: accessToken })
      .then(({ data, error }) => {
        if (error) {
          console.error("Session error:", error);
          toast({
            title: "Invalid Link",
            description: "Password reset token is invalid or expired.",
            variant: "destructive",
          });
          navigate("/login");
        } else {
          setSessionReady(true);
        }
      });
  }, [accessToken, paramsLoaded, navigate, toast]);

  // -------------------------
  // Handle password reset
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

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Password updated successfully!",
      });
      navigate("/login", { replace: true });
    }
  };

  // -------------------------
  // JSX
  // -------------------------
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
          <form onSubmit={handlePasswordReset} className="space-y-4 mt-4">
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
              
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
