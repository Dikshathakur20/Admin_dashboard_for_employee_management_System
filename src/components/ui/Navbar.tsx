import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Users, Building, Briefcase, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Navbar: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(true);

  const managementRoutes = [
    "/dashboard",
    "/employees",
    "/departments",
    "/designations",
    "/view-employees",
  ];

  // Hide Navbar on non-management routes
  if (!managementRoutes.includes(location.pathname)) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      // 1️⃣ Clear user immediately inside signOut (AuthContext must do this)
      await signOut(); 

      // 2️⃣ Navigate immediately to /auth
      navigate("/auth", { replace: true });

      // 3️⃣ Show toast
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not sign out properly",
      });
    }
  };

  return (
    <>
      {isOpen && (
        <nav className="bg-card border-b"  style={{
            background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
          }}>
          <div className="container mx-auto px-4 py-1 flex items-center justify-between">
            {/* Links */}
            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="flex items-center gap-1 hover:text-primary text-sm font-medium">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link to="/employees" className="flex items-center gap-1 hover:text-primary text-sm font-medium">
                <Users className="h-4 w-4" />
                <span>Manage Employees</span>
              </Link>
              <Link to="/departments" className="flex items-center gap-1 hover:text-primary text-sm font-medium">
                <Building className="h-4 w-4" />
                <span>Manage Departments</span>
              </Link>
              <Link to="/designations" className="flex items-center gap-1 hover:text-primary text-sm font-medium">
                <Briefcase className="h-4 w-4" />
                <span>Manage Designations</span>
              </Link>
            </div>

            {/* Sign Out Button */}
            <div className="flex items-center">
              <Button
                className="bg-[#001F7A] text-white px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-[#0029b0] transition text-sm"
                title="Click to sign out"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
