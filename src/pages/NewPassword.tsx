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
 // Supabase automatically includes this

  useEffect(() => {
  const token = searchParams.get("access_token");
  setAccessToken(token);
  setParamsLoaded(true); // URL params are now loaded
}, [searchParams]);


  useEffect(() => {
  if (accessToken === null) return; // wait until URL params are available

  if (!accessToken) {
    toast({
      title: "Error",
      description: "Invalid or expired reset link.",
      variant: "destructive",
    });
    navigate("/login", { replace: true });
  }
}, [accessToken, navigate, toast]);

 const handleUpdatePassword = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!password || !confirmPassword) {
    toast({ title: "Error", description: "All fields are required", variant: "destructive" });
    return;
  }

  if (password !== confirmPassword) {
    toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
    return;
  }

  if (!accessToken) {
    toast({ title: "Error", description: "Invalid or expired link.", variant: "destructive" });
    return;
  }

  setLoading(true);

  try {
    // ✅ Set the session first using the access token from URL
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    });

    if (sessionError) throw sessionError;

    // ✅ Now safely update the actual auth password
    const { error } = await supabase.auth.updateUser({ password });

    if (error) throw error;

    toast({
      title: "Success",
      description: "Password updated successfully!",
    });

    // ✅ Redirect to login
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
          <CardTitle className="text-2xl font-bold text-gray-800">New Password</CardTitle>
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

            <Button type="submit" className="w-full bg-[#001F7A] text-white" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPassword;
