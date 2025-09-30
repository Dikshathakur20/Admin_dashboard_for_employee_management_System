import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useLogin } from "@/contexts/LoginContext";
import { Link } from "react-router-dom";
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
  total_employees?: number;
}

interface Designation {
  designation_id: number;
  designation_title: string;
  department_id: number;
}
interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  salary: number | null;
  department_id: number | null;
  designation_id: number | null;
  file_data?: string | null;
}


const Departments = () => {
  const { user } = useLogin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [departmentDesignations, setDepartmentDesignations] = useState<Designation[]>([]);

  const [sortOption, setSortOption] = useState<"id-asc" | "id-desc" | "name-asc" | "name-desc">("id-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    fetchDepartments(currentPage);
  }, [currentPage]);

  // ✅ Fixed fetch logic
 const fetchDepartments = async (page = 1) => {
  setLoading(true);
  try {
    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;

    // Fetch departments
    const { data: deptData, error: deptError } = await supabase
      .from("tbldepartments")
      .select("*")
      .range(from, to);
    if (deptError) throw deptError;

    const deptIds = deptData?.map((d: any) => d.department_id) || [];
    if (deptIds.length === 0) {
      setDepartments([]);
      return;
    }

    // Fetch employees (use correct column name)
    const { data: empData, error: empError } = await supabase
      .from("tblemployees")
      .select("employee_id, department_id ")
      .in("department_id", deptIds);
    if (empError) throw empError;

    // Fetch designations
    const { data: desData, error: desError } = await supabase
      .from("tbldesignations")
      .select("designation_id, department_id")
      .in("department_id", deptIds);
    if (desError) throw desError;

    
    // Combine counts
const enriched = (deptData || []).map((dept: any) => ({
  department_id: dept.department_id,
  department_name: dept.department_name,
  location: dept.location,
  // Remove the `status === "active"` filter to count all employees linked to the department
  total_employees:
    empData?.filter((e: any) => e.department_id === dept.department_id).length || 0,
  total_designations:
    desData?.filter((d: any) => d.department_id === dept.department_id).length || 0,
}));

    setDepartments(enriched);
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Unable to fetch departments",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const { error } = await supabase.from("tbldepartments").delete().eq("department_id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Department removed successfully" });
      fetchDepartments(currentPage);
    } catch {
      toast({
        title: "Cannot delete",
        description: "This department has active employees. Reassign them first.",
        variant: "destructive",
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
      toast({ title: "Error", description: "Unable to fetch designations" });
      setDepartmentDesignations([]);
    }
  };

  const handleUpdateDepartment = async (dept: Department) => {
    try {
      const { error } = await supabase
        .from("tbldepartments")
        .update({
          department_name: dept.department_name,
          location: dept.location,
        })
        .eq("department_id", dept.department_id);

      if (error) throw error;
      toast({ title: "Updated", description: "Department updated successfully" });
      fetchDepartments(currentPage);
    } catch {
      toast({ title: "Error", description: "Unable to update department", variant: "destructive" });
    }
  };

  const filtered = departments.filter((d) =>
    d.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === "id-asc") return a.department_id - b.department_id;
    if (sortOption === "id-desc") return b.department_id - a.department_id;
    if (sortOption === "name-asc") return a.department_name.localeCompare(b.department_name);
    if (sortOption === "name-desc") return b.department_name.localeCompare(a.department_name);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <div className="flex justify-center p-8">Loading departments...</div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-2">
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 py-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-2xl font-bold">Departments</CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    placeholder="Search department"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 text-black bg-white border border-gray-300 shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowNewDialog(true)}
                    className="bg-[#001F7A] text-white hover:bg-[#0029b0]"
                    title="Add department"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-[#001F7A] text-white hover:bg-[#0029b0]" title="Sort">
                        Sort <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white"
                      style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
                    >
                      <DropdownMenuItem onClick={() => setSortOption("name-asc")}>Name A - Z</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("name-desc")}>Name Z - A</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("id-asc")}>Old → New</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("id-desc")}>New → Old</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold text-center">Active Employees</TableHead>
                    <TableHead className="font-bold text-center">Total Designations</TableHead>
                    <TableHead className="font-bold text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((d) => (
                    <TableRow key={d.department_id}>
                    <TableCell>{d.department_name}</TableCell>
                 <TableCell className="text-center">
                      {d.total_employees > 0 ? (
                        <Link
                          to={`/employees?department=${d.department_id}`}
                          className="text-blue-900 underline hover:text-blue-700"
                        >
                          {d.total_employees}
                        </Link>
                      ) : (
                        <span>{d.total_employees}</span> // plain text for 0
                      )}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {d.total_designations > 0 ? (
                        <Link
                          to={`/designations?department=${d.department_id}`}
                          className="text-blue-900 underline hover:text-blue-700"
                        >
                          {d.total_designations}
                        </Link>
                      ) : (
                        <span>{d.total_designations}</span> // plain text for 0
                      )}
                    </TableCell>
             
                          <TableCell className="text-center">                             
                        <div className="flex justify-end space-x-3">
                          <Button
                            size="sm"
                            className="bg-blue-900 text-white hover:bg-blue-700"
                            title="View"
                            onClick={async () => {
                              await fetchDepartmentDesignations(d.department_id);
                              setViewingDepartment(d);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-900 text-white hover:bg-blue-700"
                            title="Edit"
                            onClick={() => setEditingDepartment(d)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-900 text-white hover:bg-blue-700"
                            title="Delete"
                            onClick={() => handleDelete(d.department_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {paginated.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                {searchTerm ? "No departments match your search." : "No departments found."}
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-x-4 mt-4">
              <Button
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Previous
              </Button>
              <span className="text-sm font-medium text-gray-800">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit / New Dialogs */}
      <EditDepartmentDialog
        department={editingDepartment}
        open={!!editingDepartment}
        onOpenChange={(open) => !open && setEditingDepartment(null)}
        onSuccess={() => fetchDepartments(currentPage)}
      />
      <NewDepartmentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={() => fetchDepartments(currentPage)}
      />

      {/* Details / Inline Edit Dialog */}
  <Dialog
  open={!!viewingDepartment}
  onOpenChange={(open) => !open && setViewingDepartment(null)}
>
  <DialogContent className="max-w-lg bg-blue-50 p-6 rounded-xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-blue-900">
        Department Details
      </DialogTitle>
    </DialogHeader>
    {viewingDepartment && (
     
        <div className="space-y-3 relative">
    {/* Edit button inside the card, top-right corner */}
    <Button
      size="sm"
      className="absolute top-0 right-0 bg-blue-900 text-white hover:bg-blue-700"
      title="Edit"
      onClick={() => {
        setEditingDepartment(viewingDepartment);
        // optionally close the dialog if you want
        setViewingDepartment(null);
      }}
    >
      <Edit className="h-4 w-4" />
    </Button>
        <p>
          <span className="font-semibold">Department Name:</span>{" "}
          {viewingDepartment.department_name}
        </p>
        <p>
          <span className="font-semibold">Location:</span>{" "}
          {viewingDepartment.location || "-"}
        </p>
        <p>
          <span className="font-semibold">Total Designations:</span>{" "}
          {departmentDesignations.length}
        </p>
        {departmentDesignations.length > 0 ? (
          <ul className="list-disc list-inside ml-4">
            {departmentDesignations.map((des) => (
              <li key={des.designation_id}>{des.designation_title}</li>
            ))}
          </ul>
        ) : (
          <p>No designations found.</p>
        )}
      </div>
    )}
  </DialogContent>
</Dialog>


    </div>
  );
};

export default Departments;
