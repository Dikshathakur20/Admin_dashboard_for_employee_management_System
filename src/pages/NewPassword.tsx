import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NewPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) return;
    // Verify token
    const verifyToken = async () => {
      const { data, error } = await supabase
        .from("tbladmins_reset")
        .select("email, expires_at")
        .eq("token", token)
        .single();

      if (error || !data) {
        toast({ title: "Invalid Link", description: "Token is invalid or expired", variant: "destructive" });
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast({ title: "Expired Link", description: "Token has expired", variant: "destructive" });
        return;
      }

      setEmail(data.email);
      setValidToken(true);
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast({ title: "Mismatch", description: "Passwords do not match", variant: "destructive" });
    setLoading(true);

    try {
      // Update password in tbladmins
      const { error } = await supabase
        .from("tbladmins")
        .update({ password }) // Ideally, hash password before storing
        .eq("email", email);

      if (error) throw error;

      // Optionally, delete used token
      await supabase.from("tbladmins_reset").delete().eq("token", token);

      toast({ title: "Success", description: "Password updated successfully" });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) return <p className="text-center mt-10">Verifying token...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Set New Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
        <Input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">{loading ? "Saving..." : "Set Password"}</Button>
      </form>
    </div>
  );
};

export default NewPassword;
