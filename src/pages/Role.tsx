import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Role = () => {
  const [role, setRole] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      toast.error("Please select a role!");
      return;
    }

    if (role === "Employee") {
      toast.success("Redirecting to Employee Login...");
      navigate("/employee/login");
    } else if (role === "Admin") {
      if (adminCode === "admin@123") {
        toast.success("Admin verified! Redirecting...");
        navigate("/login");
      } else {
        toast.error("Invalid admin code!");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-blue-700 text-3xl font-bold mb-8">Role </h1>

      <Card
        className="w-full max-w-md shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md"
        style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Select Your Role
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Choose your role to continue to the appropriate login portal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 mt-4" >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
           <div>
  <label className="block text-gray-700 font-medium mb-2">Choose Role</label>
  <select
    value={role}
    onChange={(e) => setRole(e.target.value)}
    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
    style={{
      background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
      color: "#1e3a8a",
      fontWeight: "500",
    }}
  >
    <option
      value=""
      style={{
        background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
        
      }}
    >
      -- Select Role --
    </option>
    <option
      value="Employee"
      style={{
        background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
        
      }}
    >
      Employee
    </option>
    <option
      value="Admin"
      style={{
        background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
        
      }}
    >
      Admin
    </option>
  </select>
</div>


            {/* Admin Code Input */}
            {role === "Admin" && (
              <div>
                <Label className="text-gray-700 font-medium">Enter Admin Code</Label>
                <Input
                  type="password"
                  placeholder="Enter admin code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-center mt-6">
              <Button
                type="submit"
                className="w-64 bg-[#001F7A] text-white hover:bg-[#002f9a] transition"
              >
                Continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Role;
