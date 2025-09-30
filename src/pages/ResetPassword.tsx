import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1: Verify email exists + send OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if email exists in auth.users
      const { data: users, error } = await supabase
        .from("users") // 👈 your users table or use supabase.auth.admin.listUsers() via edge function
        .select("id")
        .eq("email", email)
        .single();

      if (error || !users) {
        toast({ title: "Error", description: "Invalid Account", variant: "destructive" });
        return;
      }

      setUserId(users.id);

      // Generate OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setServerOtp(generatedOtp);

      // Send OTP via Supabase function / email
      // For demo, just log it or store in a table
      await supabase.from("otps").insert({ email, otp: generatedOtp });

      toast({ title: "OTP Sent", description: "Check your email inbox." });
      setStep("otp");
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== serverOtp) {
      return toast({ title: "Error", description: "Invalid OTP", variant: "destructive" });
    }
    setStep("reset");
  };

  // Step 3: Reset password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      return toast({ title: "Error", description: "All fields are required", variant: "destructive" });
    }
    if (newPassword !== confirmPassword) {
      return toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
    }

    setLoading(true);
    try {
      // Use Admin API (requires service role in edge function) OR handle via RLS table
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Password updated successfully" });
        navigate("/login", { replace: true });
      }
    } catch {
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
          <CardTitle className="text-2xl font-bold text-gray-800">
            {step === "email" && "Enter Email"}
            {step === "otp" && "Verify OTP"}
            {step === "reset" && "Set New Password"}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            {step === "email" && "Enter your account email to receive OTP"}
            {step === "otp" && "Enter the OTP sent to your email"}
            {step === "reset" && "Enter a new password for your account"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 mt-4">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full bg-[#001F7A] text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <Button type="submit" className="w-full bg-[#001F7A] text-white">
                Verify OTP
              </Button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#001F7A] text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
