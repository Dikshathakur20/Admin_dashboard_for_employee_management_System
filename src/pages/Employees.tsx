// src/pages/Employees.tsx
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useLogin } from "@/contexts/LoginContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Eye, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EditEmployeeDialog } from "@/components/dashboard/EditEmployeeDialog";
import { NewEmployeeDialog } from "@/components/dashboard/NewEmployeeDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface Department {
  department_id: number;
  department_name: string;
}

interface Designation {
  designation_id: number;
  designation_title: string;
}

const Employees = () => {
  const { user } = useLogin();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const departmentFilter = params.get("department");
  const designationFilter = params.get("designation");

  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();

  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "id-asc" | "id-desc">("id-desc");

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(10);

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 &&
        visibleCount < employees.length
      ) {
        setVisibleCount((prev) => prev + 10);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [employees, visibleCount]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesResult, departmentsResult, designationsResult] = await Promise.all([
        supabase.from("tblemployees").select("*").order("employee_id", { ascending: false }),
        supabase.from("tbldepartments").select("*").order("department_name"),
        supabase.from("tbldesignations").select("*").order("designation_title"),
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (departmentsResult.error) throw departmentsResult.error;
      if (designationsResult.error) throw designationsResult.error;

      setEmployees(employeesResult.data || []);
      setDepartments(departmentsResult.data || []);
      setDesignations(designationsResult.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Data Loading Issue",
        description: "Unable to fetch employee information",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: number) => {
    toast({
      title: "Are you sure you want to remove this employee?",
      description: (
        <div className="flex justify-end gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700 text-white"
            onClick={async () => {
              try {
                const { error } = await supabase
                  .from("tblemployees")
                  .delete()
                  .eq("employee_id", employeeId);
                if (error) throw error;
                toast({ title: "Success", description: "Employee removed successfully" });
                fetchData();
              } catch (error) {
                console.error(error);
                toast({ title: "Removal Issue", description: "Unable to remove employee" });
              }
            }}
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-gray-300 text-black hover:bg-gray-400"
          >
            Cancel
          </Button>
        </div>
      ),
    });
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "Not Assigned";
    return departments.find((d) => d.department_id === departmentId)?.department_name || "Unknown";
  };

  const getDesignationTitle = (designationId: number | null) => {
    if (!designationId) return "Not Assigned";
    return designations.find((d) => d.designation_id === designationId)?.designation_title || "Unknown";
  };

  const filteredEmployees = employees
    .filter((emp) =>
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((emp) => (departmentFilter ? emp.department_id === Number(departmentFilter) : true))
    .filter((emp) => (designationFilter ? emp.designation_id === Number(designationFilter) : true));

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortOption === "name-asc")
      return (a.first_name + " " + a.last_name).localeCompare(b.first_name + " " + b.last_name);
    if (sortOption === "name-desc")
      return (b.first_name + " " + b.last_name).localeCompare(a.first_name + " " + a.last_name);
    if (sortOption === "id-asc") return a.employee_id - b.employee_id;
    if (sortOption === "id-desc") return b.employee_id - a.employee_id;
    return b.employee_id - a.employee_id;
  });

  const visibleEmployees = sortedEmployees.slice(0, visibleCount);

  const handleNewEmployee = (newEmp: Employee) => setEmployees((prev) => [newEmp, ...prev]);

  const renderProfilePicture = (emp?: Employee, size = 40) => {
    if (!emp) return <div className="rounded-full bg-gray-200 h-8 w-8 mx-auto"></div>;
    if (emp.file_data) {
      return (
        <div className="rounded-full overflow-hidden border border-blue-900" style={{ width: size, height: size }}>
          <img src={emp.file_data} alt={`${emp.first_name} ${emp.last_name}`} className="w-full h-full object-cover" loading="lazy" />
        </div>
      );
    }
    const firstInitial = emp.first_name?.[0] || "";
    const lastInitial = emp.last_name?.[0] || "";
    return (
      <div className="rounded-full bg-gray-400 flex items-center justify-center text-white border border-blue-900"
        style={{ width: size, height: size, fontSize: size * 0.4 }}>
        {firstInitial}{lastInitial}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-2">
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 py-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-2xl font-bold">
                {departmentFilter || designationFilter ? (
                  <>
                    Employees{" "}
                    {departmentFilter && `: ${getDepartmentName(Number(departmentFilter))} Department`}
                    {designationFilter && ` : ${getDesignationTitle(Number(designationFilter))}`}
                  </>
                ) : (
                  "Employees"
                )}
              </CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    placeholder="Search employee"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(10); }}
                    className="pl-10 text-black bg-white border border-gray-300 shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowNewDialog(true)}
                    className="bg-[#001F7A] text-white hover:bg-[#0029b0]"
                    title="Add Employee"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-[#001F7A] text-white hover:bg-[#0029b0]" title="Sort">
                        Sort
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white"
                      style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}>
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
            {(departmentFilter || designationFilter) && (
              <div className="mb-4">
                <Button
                  onClick={() => window.location.href = "/employees"}
                  className="bg-blue-600 text-white hover:bg-blue-800"
                  title="Restore Employees"
                >
                  All Employees
                </Button>
              </div>
            )}

            <div className="border rounded-2g overflow-hidden relative">
              {/* Selection/loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">Loading employees...</span>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleEmployees.map((emp) => (
                    <TableRow key={emp.employee_id} className="hover:bg-gray-100 cursor-pointer select-none">
                      <TableCell>{renderProfilePicture(emp, 36)}</TableCell>
                      <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell><Badge variant="secondary">{getDepartmentName(emp.department_id)}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{getDesignationTitle(emp.designation_id)}</Badge></TableCell>
                      <TableCell>{new Date(emp.hire_date).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell>{emp.salary ? `₹${emp.salary.toLocaleString("en-IN")}` : "Not Set"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-900 text-white hover:bg-blue-700 h-8 w-8 p-0"
                            onClick={() => setViewingEmployee(emp)}
                            disabled={loading}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-900 text-white hover:bg-blue-700 h-8 w-8 p-0"
                            onClick={() => handleDelete(emp.employee_id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && visibleEmployees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-3 text-muted-foreground">
                        {searchTerm ? "No employees found matching your search." : "No employees found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {visibleEmployees.length < sortedEmployees.length && !loading && (
              <div className="text-center py-4 text-sm text-gray-600">Loading more employees...</div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <EditEmployeeDialog
        employee={editingEmployee}
        departments={departments}
        designations={designations}
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
        onSuccess={fetchData}
      />
      <NewEmployeeDialog
        open={showNewDialog}
        onOpenChange={(open) => setShowNewDialog(open)}
        onSuccess={fetchData}
        onEmployeeAdded={handleNewEmployee}
      />

      {/* Employee Details Dialog */}
      <Dialog open={!!viewingEmployee} onOpenChange={(open) => !open && setViewingEmployee(null)}>
        <DialogContent
          className="w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-blue-50 p-6 rounded-xl"
          style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">Employee Details</DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1 text-sm">
                <p><span className="font-semibold">Name:</span> {viewingEmployee.first_name} {viewingEmployee.last_name}</p>
                <p><span className="font-semibold">Email:</span> {viewingEmployee.email}</p>
                <p><span className="font-semibold">Department:</span> {getDepartmentName(viewingEmployee.department_id)}</p>
                <p><span className="font-semibold">Designation:</span> {getDesignationTitle(viewingEmployee.designation_id)}</p>
                <p><span className="font-semibold">Hire Date:</span> {new Date(viewingEmployee.hire_date).toLocaleDateString("en-GB")}</p>
                <p><span className="font-semibold">Salary:</span> {viewingEmployee.salary ? `₹${viewingEmployee.salary}` : "Not set"}</p>
              </div>
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border border-blue-900">
                  {viewingEmployee.file_data ? (
                    <img
                      src={viewingEmployee.file_data}
                      alt={`${viewingEmployee.first_name} ${viewingEmployee.last_name}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl bg-gray-400">
                      {viewingEmployee.first_name[0]}{viewingEmployee.last_name[0]}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-blue-900 text-white hover:bg-blue-700 h-8 px-3"
                    title="Edit Employee"
                    onClick={() => { setEditingEmployee(viewingEmployee); setViewingEmployee(null); }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
