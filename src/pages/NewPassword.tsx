import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const NewPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);

  // ✅ FIX: Extract tokens safely and validate them before using
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
    const access_token = searchParams.get("access_token") || hashParams.get("access_token");
    const refresh_token = searchParams.get("refresh_token") || hashParams.get("refresh_token");

    // ✅ Validate token structure before proceeding
    const isValidToken = (token: string | null) =>
      token && token.split(".").length === 3; // JWT must have 3 parts

    if (isValidToken(access_token) && isValidToken(refresh_token)) {
      (async () => {
        const { data, error } = await supabase.auth.setSession({
          access_token: access_token!,
          refresh_token: refresh_token!,
        });

        if (error) {
          toast({
            title: "Error",
            description: "Session setup failed: " + error.message,
            variant: "destructive",
          });
          navigate("/login", { replace: true });
        } else {
          setAccessToken(access_token!);
          setParamsLoaded(true);
        }
      })();
    } else {
      toast({
        title: "Error",
        description: "Invalid or expired reset link.",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken) {
      toast({
        title: "Error",
        description: "Invalid or expired link.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ Update the actual Supabase Auth password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully!",
      });

      navigate("/login", { replace: true });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <Card
        className="w-full max-w-md shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md"
        style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            New Password
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Enter your new password below to complete the reset process.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 mt-4">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            <div className="relative">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#001F7A] text-white"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPassword;
