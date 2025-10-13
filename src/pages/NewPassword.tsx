import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function NewPassword() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // -------------------------
  // Extract access_token from URL hash
  // -------------------------
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const tokenFromHash = new URLSearchParams(hash).get("access_token");
    setAccessToken(tokenFromHash);
  }, []);

  // -------------------------
  // Validate token presence
  // -------------------------
  useEffect(() => {
    if (accessToken === null) return;

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
  // Validate form fields
  // -------------------------
  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------
  // Handle password reset
  // -------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("hello");
    console.log("Access Token:", accessToken);
    console.log("Password:", password);
    console.log("Confirm Password:", confirmPassword);
    if (!validateForm()) return;
    if (!accessToken) return;

    setLoading(true);
    try {
      // 1️⃣ Establish a temporary session using the recovery token
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: accessToken, // required temporarily for SDK
      });
      if (sessionError) throw sessionError;

      // 2️⃣ Update password now that session exists
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // 3️⃣ Success
      setIsSubmitted(true);
      toast({
        title: "Success",
        description: "Password has been reset successfully! You can now log in.",
      });
    } catch (error: any) {
      console.log("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Render invalid token
  // -------------------------
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Invalid or Missing Token</CardTitle>
            <CardDescription className="text-center">
              The password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="link" asChild className="w-full">
              <Link to="/forgot-password" className="flex items-center justify-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to forgot password
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // -------------------------
  // Render reset form
  // -------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {!isSubmitted ? "Create a new password for your account" : "Your password has been reset successfully"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isSubmitted ? (
            // ✅ Form fixed to properly capture submit
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    tabIndex={-1}
                  >

                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}

                    {showPassword ? <EyeOff size={6} /> : <Eye size={6} />}

                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-invalid={!!errors.confirmPassword}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    tabIndex={-1}
                  >

                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}

                    {showConfirmPassword ? <EyeOff size={6} /> : <Eye size={6} />}

                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              {/* ✅ FIX: Replace shadcn Button with native <button> inside form */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-anthem-purple hover:bg-anthem-darkPurple text-white py-2 rounded flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Resetting password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="mb-4">Your password has been reset successfully.</p>
              <Button variant="default" className="mt-4 bg-anthem-purple hover:bg-anthem-darkPurple" asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>

        {!isSubmitted && (
          <CardFooter>
            <Button variant="link" asChild className="w-full">
              <Link to="/login" className="flex items-center justify-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

            <CardTitle className="text-2xl font-bold text-

