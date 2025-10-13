import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import jwtDecode from "jwt-decode";
import { createClient } from "@supabase/supabase-js";

interface TokenPayload {
  email: string;
  iat?: number;
  exp?: number;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function NewPassword(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Decode token and extract gmail
  useEffect(() => {
    try {
      if (!token) {
        setError("No access token provided.");
        return;
      }
      const decoded = jwtDecode<TokenPayload>(token);
      if (!decoded.email || !decoded.email.includes("@gmail.com")) {
        setError("Token does not contain a valid Gmail address.");
        return;
      }
      setEmail(decoded.email);
    } catch (err) {
      setError("Invalid or expired token.");
    }
  }, [token]);

  const validate = () => {
    if (!password || !confirmPassword) {
      setError("Please fill both fields.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate() || !email) return;

    setLoading(true);
    try {
      // Check if email exists in tbladmins
      const { data: existingAdmin, error: fetchError } = await supabase
        .from("tbladmins")
        .select("*")
        .eq("email", email)
        .single();

      if (fetchError || !existingAdmin) {
        throw new Error("Email not found or unauthorized.");
      }

      // Update password in tbladmins
      const { error: updateError } = await supabase
        .from("tbladmins")
        .update({ password })
        .eq("email", email);

      if (updateError) throw updateError;

      setSuccess(`Password updated successfully for ${email}`);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-3 text-center">
          Set a New Password
        </h1>

        {email && (
          <p className="text-sm text-gray-600 text-center mb-4">
            Changing password for <span className="font-medium">{email}</span>
          </p>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded mb-3 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-2 text-sm text-gray-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
