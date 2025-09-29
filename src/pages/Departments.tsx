import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useLogin } from "@/contexts/LoginContext"; // ✅ updated
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Eye, Edit, Trash2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EditDepartmentDialog } from "@/components/dashboard/EditDepartmentDialog";
import { NewDepartmentDialog } from "@/components/dashboard/NewDepartmentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Department {
  department_id: number;
  department_name: string;
  location: string | null;
  total_designations?: number;
}

interface Designation {
  designation_id: number;
  designation_title: string;
  department_id: number;
}

const Departments = () => {
  const { user } = useLogin(); // ✅ replaced useAuth
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [viewingDepartment, setViewingDepartment] =
    useState<Department | null>(null);
  const [departmentDesignations, setDepartmentDesignations] = useState<
    Designation[]
  >([]);

  // ⭐ Sorting & Pagination
  const [sortOption, setSortOption] = useState<
    "id-asc" | "id-desc" | "name-asc" | "name-desc"
  >("id-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!user) return <Navigate to="/login" replace />; // ✅ updated

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tbldepartments")
        .select("*, tbldesignations (designation_id)");

      if (error) throw error;

      const enriched = (data || []).map((dept: any) => ({
        department_id: dept.department_id,
        department_name: dept.department_name,
        location: dept.location,
        total_designations: dept.tbldesignations
          ? dept.tbldesignations.length
          : 0,
      }));

      setDepartments(enriched);
    } catch {
      toast({
        title: "Error",
        description: "Unable to fetch departments",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const { error } = await supabase
        .from("tbldepartments")
        .delete()
        .eq("department_id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Department removed successfully",
      });
      fetchDepartments();
    } catch {
      toast({
        title: "Error",
        description: "Unable to delete department",
      });
    }
  };

  const fetchDepartmentDesignations = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from("tbldesignations")
        .select("*")
        .eq("department_id", id)
        .order("designation_title");

      if (error) throw error;
      setDepartmentDesignations(data || []);
    } catch {
      toast({
        title: "Error",
        description: "Unable to fetch designations",
      });
      setDepartmentDesignations([]);
    }
  };

  // ⭐ Filter + Sort + Paginate
  const filtered = departments.filter((d) =>
    d.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === "id-asc") return a.department_id - b.department_id;
    if (sortOption === "id-desc") return b.department_id - a.department_id;
    if (sortOption === "name-asc")
      return a.department_name.localeCompare(b.department_name);
    if (sortOption === "name-desc")
      return b.department_name.localeCompare(a.department_name);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading)
    return <div className="flex justify-center p-8">Loading departments...</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* …rest of the component remains unchanged… */}
    </div>
  );
};

export default Departments;
