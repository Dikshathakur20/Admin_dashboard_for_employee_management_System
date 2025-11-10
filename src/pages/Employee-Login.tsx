import logo from '/public/logo.png'; 
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";


const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ email: "", password: "" });
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const inactivityTimer = useRef<number | null>(null);

  // 🔐 Password rule
  const generatePassword = (employee: any) => {
  const empCode = employee.employee_code || "";
  const phone = employee.phone || "";
  
  // handle both "dob" and "date_of_birth" field names
  const dobValue = employee.dob || employee.date_of_birth || "";
  
  let year = "0000";
  if (dobValue) {
    const parsedDate = new Date(dobValue);
    if (!isNaN(parsedDate.getTime())) {
      year = parsedDate.getFullYear().toString();
    }
  }

  const last3 = empCode.slice(-3);
  const last4 = phone.slice(-4);

  return `${last3}#${last4}@${year}`;
};

  // ✅ LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: empAuth, error } = await supabase
        .from("tblemployees")
        .select("*")
        .eq("email", form.email)
        .single();

      if (error || !empAuth) throw new Error("Account not found.");
      if (empAuth.status !== "Active") throw new Error("Account is inactive.");

      const expected = generatePassword(empAuth);
      if (form.password !== expected) throw new Error("Invalid password format.");

      localStorage.setItem("employee", JSON.stringify(empAuth));
      toast({ title: "Login Successful", description: "Welcome back!" });
      navigate("/employee/Dashboard");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: emp, error: empError } = await supabase
        .from("tblemployees")
        .select("*")
        .eq("email", form.email)
        .single();

      if (empError || !emp) throw new Error("Email not found in employee records.");

      const generatedPassword = generatePassword(emp);

      const { error: insertError } = await supabase.from("tblemployeeauth").insert([
        {
          employee_id: emp.employee_id,
          email: form.email,
          password: generatedPassword,
          status: "Active",
          role: "employee",
          employee_code: emp.employee_code,
          phone: emp.phone,
          dob: emp.date_of_birth,
        },
      ]);

      if (insertError) throw insertError;

      toast({
        title: "Registration Successful",
        description: `Your account has been created. Use password: ${generatedPassword}`,
      });

      setMode("login");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FORGOT PASSWORD (send reset request)
  const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const { data: empAuth, error } = await supabase
      .from("tblemployeeauth")
      .select("employee_id")
      .eq("email", form.email)
      .single();

    if (error || !empAuth) throw new Error("Account not found.");

    // Step 1: Create the password reset request
    const { data: inserted, error: insertError } = await supabase
      .from("tblpasswordresets")
      .insert([
        {
          email: form.email,
          employee_id: empAuth.employee_id,
          status: "Pending",
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    toast({
      title: "Request Sent",
      description: "Admin will review your password reset request shortly.",
    });

    // Step 2: Subscribe to real-time updates for this record
    const channel = supabase
      .channel("password_reset_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tblpasswordresets",
          filter: `id=eq.${inserted.id}`,
        },
        (payload) => {
          console.log("Realtime update:", payload);
          const newStatus = payload.new.status;
          if (newStatus === "Approved") {
            toast({
              title: "Approved",
              description: "Your password reset request has been approved!",
            });
            channel.unsubscribe();
            navigate("/employee/reset-password", { state: { email: form.email } });
          } else if (newStatus === "Rejected") {
            toast({
              title: "Rejected",
              description: "Your password reset request was rejected by admin.",
              variant: "destructive",
            });
            channel.unsubscribe();
          }
        }
      )
      .subscribe();

    // Clean up subscription when leaving
    return () => {
      channel.unsubscribe();
    };
  } catch (err: any) {
    toast({ title: "Error", description: err.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};


  // 🕒 Auto logout for inactivity
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = window.setTimeout(() => {
      toast({
        title: "Session Expired",
        description: "You were logged out due to inactivity.",
        variant: "destructive",
      });
      localStorage.removeItem("employee");
      navigate("/role");
    }, 5 * 60 * 1000);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
    };
  }, []);

  // 🧱 UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">

       <button
      onClick={() => navigate(-1)} // navigates back to previous page
      className="absolute top-6 left-6 flex items-center gap-2 group"
       style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
    >
      <img
        src="/logo.png"
       
       alt="Company Logo" className="h-12 w-auto"
      />
      
    </button>
      <h1 className="text-blue-700 text-3xl font-bold mb-8">Employee Portal</h1>

      <Card
        className="w-full max-w-md shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md"
        style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            {mode === "login"
              ? "Employee Login"
              : mode === "register"
              ? "Register Employee Account"
              : "Forgot Password"}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            {mode === "login"
              ? "Enter credentials to access your dashboard."
              : mode === "register"
              ? "Create your employee account."
              : "Request password reset approval from admin."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 mt-4">
          <form
            onSubmit={
              mode === "login"
                ? handleLogin
                : mode === "register"
                ? handleRegister
                : handleForgotPassword
            }
          >
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {mode === "login" && (
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                
                <p className="text-xs text-gray-600 mt-1">
                  Hint: Last 3 of code + # + last 4 of phone + @ + birth year.
                </p>
              </div>
            )}

            <div className="flex items-center justify-center mt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-64 bg-[#001F7A] text-white hover:bg-[#002f9a] transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : mode === "login"
                ? "Sign In"
                : mode === "register"
                ? "Register"
                : "Send Request"}
              </Button>
            </div>

            {/* 🔁 Toggle buttons */}
            <div className="mt-4 text-center space-y-2">
              {mode !== "login" && (
                <Button
                  variant="outline"
                  onClick={() => setMode("login")}
                  className="w-64 bg-[#001F7A] text-white hover:bg-[#002f9a] transition"
                >
                  Back to Login
                </Button>
              )}
              {mode === "login" && (
                <>
                <div>

                  </div>
                  {/*
                  <Button
                    variant="outline"
                    onClick={() => setMode("forgot")}
                    className="w-64 bg-[#001F7A] text-white hover:bg-[#002f9a] transition"
                  >
                    Forgot Password?
                  </Button>*/}
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeLogin;
