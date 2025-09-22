import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EditEmployeeDialog } from '@/components/dashboard/EditEmployeeDialog';
import { NewEmployeeDialog } from '@/components/dashboard/NewEmployeeDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  profile_picture_url?: string | null; // ✅ changed: store URL instead of BYTEA
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
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();

  // ⭐ NEW: Sorting + Pagination state
  const [sortOption, setSortOption] = useState<
    "name-asc" | "name-desc" | "date-asc" | "date-desc"
  >("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesResult, departmentsResult, designationsResult] =
        await Promise.all([
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
      toast({
        title: "Data Loading Issue",
        description: "Unable to fetch employee information",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: number) => {
    if (!confirm("Are you sure you want to remove this employee?")) return;
    try {
      const { error } = await supabase
        .from("tblemployees")
        .delete()
        .eq("employee_id", employeeId);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Employee removed successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Removal Issue",
        description: "Unable to remove employee",
        variant: "default",
      });
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "Not Assigned";
    const dept = departments.find((d) => d.department_id === departmentId);
    return dept?.department_name || "Unknown";
  };

  const getDesignationTitle = (designationId: number | null) => {
    if (!designationId) return "Not Assigned";
    const designation = designations.find((d) => d.designation_id === designationId);
    return designation?.designation_title || "Unknown";
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ⭐ NEW: Sorting logic
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortOption === "name-asc") {
      return (a.first_name + " " + a.last_name).localeCompare(
        b.first_name + " " + b.last_name
      );
    } else if (sortOption === "name-desc") {
      return (b.first_name + " " + b.last_name).localeCompare(
        a.first_name + " " + a.last_name
      );
    } else if (sortOption === "date-asc") {
      return (
        new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime()
      );
    } else if (sortOption === "date-desc") {
      return (
        new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime()
      );
    }
    return 0;
  });

  // ⭐ NEW: Pagination logic
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNewEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading employees</div>;
  }

  // ✅ Helper to render profile picture (using Supabase Storage URL)
  const renderProfilePicture = (emp: Employee, size = 32) => {
    if (emp.profile_picture_url) {
      return (
        <img
          src={emp.profile_picture_url}
          alt={`${emp.first_name} ${emp.last_name}`}
          className={`h-${size} w-${size} rounded-full object-cover border-2 border-blue-900`}
        />
      );
    }

    return (
      <div
        className={`h-${size} w-${size} rounded-full bg-gray-300 flex items-center justify-center text-lg text-white border-2 border-blue-900`}
      >
        {emp.first_name[0]}
        {emp.last_name[0]}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="px-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Employees</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="px-0">
            <div className="space-y-4">
              {/* Search + Sort controls */}
              <div className="flex items-center justify-between">
                {/* Search Bar */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                  <Input
                    placeholder="Search employee"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 text-black placeholder-black bg-white border border-gray-400 shadow-sm"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    onClick={() => setShowNewDialog(true)}
                    className="bg-[#001F7A] text-white hover:bg-[#0029b0] hover:text-white transition"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Employee
                  </Button>
                  {/* Sort Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-[#001F7A] text-white hover:bg-[#0029b0] hover:text-white transition">
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem onClick={() => setSortOption("name-asc")}>
                        Name (A–Z)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("name-desc")}>
                        Name (Z–A)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("date-asc")}>
                        Hire Date (Old → New)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("date-desc")}>
                        Hire Date (New → Old)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Profile</TableHead>
                      <TableHead className="font-bold">Full Name</TableHead>
                      <TableHead className="font-bold">Email</TableHead>
                      <TableHead className="font-bold">Department</TableHead>
                      <TableHead className="font-bold">Designation</TableHead>
                      <TableHead className="font-bold">Hire Date</TableHead>
                      <TableHead className="font-bold">Salary</TableHead>
                      <TableHead className="font-bold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.map((employee) => (
                      <TableRow key={employee.employee_id}>
                        <TableCell>{renderProfilePicture(employee, 10)}</TableCell>
                        <TableCell className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getDepartmentName(employee.department_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getDesignationTitle(employee.designation_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(employee.hire_date).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell>
                          {employee.salary
                            ? `₹${employee.salary.toLocaleString("en-IN")}`
                            : "Not Set"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-900 text-white hover:bg-blue-700"
                              onClick={() => setViewingEmployee(employee)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-900 text-white hover:bg-blue-700"
                              onClick={() => setEditingEmployee(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-900 text-white hover:bg-blue-700"
                              onClick={() => handleDelete(employee.employee_id)}
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

                        {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <Button
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Prev
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
            )}    

              {filteredEmployees.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  {searchTerm
                    ? "No employees found matching your search."
                    : "No employees found."}
                </div>
              )}
            </div>
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
      <Dialog
        open={!!viewingEmployee}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
      >
        <DialogContent className="max-w-lg bg-blue-50 p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">
              Employee Details
            </DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="flex items-start justify-between gap-6">
              {/* Left: Employee details */}
              <div className="space-y-3 flex-1">
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {viewingEmployee.first_name} {viewingEmployee.last_name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {viewingEmployee.email}
                </p>
                <p>
                  <span className="font-semibold">Department:</span>{" "}
                  {getDepartmentName(viewingEmployee.department_id)}
                </p>
                <p>
                  <span className="font-semibold">Designation:</span>{" "}
                  {getDesignationTitle(viewingEmployee.designation_id)}
                </p>
                <p>
                  <span className="font-semibold">Hire Date:</span>{" "}
                  {new Date(viewingEmployee.hire_date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Salary:</span>{" "}
                  {viewingEmployee.salary
                    ? `₹${viewingEmployee.salary}`
                    : "Not set"}
                </p>
              </div>

              {/* Right: Profile picture */}
              <div className="shrink-0">
                {renderProfilePicture(viewingEmployee, 32)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
