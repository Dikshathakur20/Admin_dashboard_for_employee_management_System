// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/contexts/LoginContext";   // ✅ fixed import
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useLogin(); // ✅ correct hook
  const navigate = useNavigate();

  const [employeeCount, setEmployeeCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [designationCount, setDesignationCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: empCount } = await supabase
          .from("tblemployees")
          .select("*", { count: "exact", head: true });

        const { count: deptCount } = await supabase
          .from("tbldepartments")
          .select("*", { count: "exact", head: true });

        const { count: desigCount } = await supabase
          .from("tbldesignations")
          .select("*", { count: "exact", head: true });

        setEmployeeCount(empCount || 0);
        setDepartmentCount(deptCount || 0);
        setDesignationCount(desigCount || 0);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, []);

  // 🔐 protect dashboard
  if (!user) return <Navigate to="/login" replace />;

  const cards = [
    {
      title: "Employees",
      count: employeeCount,
      subtitle: "Active employees",
      route: "/employees",
    },
    {
      title: "Departments",
      count: departmentCount,
      subtitle: "Total departments",
      route: "/departments",
    },
    {
      title: "Designations",
      count: designationCount,
      subtitle: "Available positions",
      route: "/designations",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <h1 className="text-2xl font-bold mb-6 text-[#001F7A]">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            onClick={() => navigate(card.route)}
            className="cursor-pointer hover:shadow-lg transition flex flex-col justify-between"
            style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
          >
            <CardHeader className="pb-1">
              <CardTitle className="text-xl font-semibold">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex flex-col items-start">
                <span className="text-xl font-bold">{card.count}</span>
                <span className="text-sm text-muted-foreground">{card.subtitle}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
