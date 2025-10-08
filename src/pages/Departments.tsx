import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useLogin } from "@/contexts/LoginContext";
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

  // ✅ Infinite scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 10;

  if (!user) return <Navigate to="/login" replace />;

  // Fetch departments when page changes
  useEffect(() => {
    fetchDepartments(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading]);

  // ✅ Fixed fetch logic with append
  const fetchDepartments = async (pageNum = 1) => {
    setLoading(true);
    try {
      const from = (pageNum - 1) * pageSize;
      const to = pageNum * pageSize - 1;

      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from("tbldepartments")
        .select("*")
        .range(from, to);
      if (deptError) throw deptError;

      if (!deptData || deptData.length === 0) {
        setHasMore(false);
        return;
      }

      const deptIds = deptData.map((d: any) => d.department_id) || [];

      // Fetch employees count
      const { data: empData, error: empError } = await supabase
        .from("tblemployees")
        .select("employee_id, department_id")
        .in("department_id", deptIds);
      if (empError) throw empError;

      // Fetch designations count
      const { data: desData, error: desError } = await supabase
        .from("tbldesignations")
        .select("designation_id, department_id")
        .in("department_id", deptIds);
      if (desError) throw desError;

      const enriched = deptData.map((dept: any) => ({
        department_id: dept.department_id,
        department_name: dept.department_name,
        location: dept.location,
        total_employees:
          empData?.filter((e: any) => e.department_id === dept.department_id).length || 0,
        total_designations:
          desData?.filter((d: any) => d.department_id === dept.department_id).length || 0,
      }));

      setDepartments((prev) => [...prev, ...enriched]);
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
  try {
    const { count, error: countError } = await supabase
      .from("tblemployees")
      .select("employee_id", { count: "exact", head: true })
      .eq("department_id", id);

    if (countError) throw countError;

    if (count && count > 0) {
      toast({
        title: "Cannot delete",
        description: `This department has ${count} active employee(s). Reassign them first.`,
        variant: "destructive",
      });
      return;
    }

    // ✅ Replace confirm() with toast confirmation
    toast({
      title: "Are you sure?",
      description: (
        <div className="flex justify-end gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={async () => {
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

                // Optionally refresh data if needed
                fetchData?.();
              } catch (error) {
                console.error(error);
                toast({
                  title: "Deletion Failed",
                  description: "Unable to remove department",
                  variant: "destructive",
                });
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
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Unable to verify department employees",
      variant: "destructive",
    });
  }
};


      // Reset and refetch from start
      setDepartments([]);
      setPage(1);
      setHasMore(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Something went wrong while deleting department.",
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
      setDepartments([]);
      setPage(1);
      setHasMore(true);
    } catch {
      toast({
        title: "Error",
        description: "Unable to update department",
        variant: "destructive",
      });
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

  if (loading && departments.length === 0)
    return <div className="flex justify-center p-8">Loading departments...</div>;

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
                      <DropdownMenuItem onClick={() => setSortOption("name-asc")}>
                        Name A - Z
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("name-desc")}>
                        Name Z - A
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("id-asc")}>
                        Old → New
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption("id-desc")}>
                        New → Old
                      </DropdownMenuItem>
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
                    <TableHead className="font-bold text-center">Total Designations</TableHead>
                     <TableHead className="font-bold text-center">Active Employees</TableHead>
                    <TableHead className="font-bold text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((d) => (
                    <TableRow key={d.department_id}>
                      <TableCell>{d.department_name}</TableCell>
                       <TableCell className="text-center">
                        {d.total_designations > 0 ? (
                          <Link
                            to={`/designations?department=${d.department_id}`}
                            className="text-gray-900 hover:text-blue-900 hover:underline transition-colors duration-200"
                          >
                            {d.total_designations}
                          </Link>
                        ) : (
                          <span>{d.total_designations}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {d.total_employees > 0 ? (
                          <Link
                            to={`/employees?department=${d.department_id}`}
                            className="text-gray-900 hover:text-blue-900 hover:underline transition-colors duration-200"
                          >
                            {d.total_employees}
                          </Link>
                        ) : (
                          <span>{d.total_employees}</span>
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

            {sorted.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                {searchTerm ? "No departments match your search." : "No departments found."}
              </div>
            )}

            {/* Infinite scroll loader */}
            {hasMore && (
              <div ref={loaderRef} className="text-center py-4 text-gray-600 text-sm">
                {loading ? "Loading more..." : "Scroll down to load more"}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit / New Dialogs */}
      <EditDepartmentDialog
        department={editingDepartment}
        open={!!editingDepartment}
        onOpenChange={(open) => !open && setEditingDepartment(null)}
        onSuccess={() => {
          setDepartments([]);
          setPage(1);
          setHasMore(true);
        }}
      />
      <NewDepartmentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={() => {
          setDepartments([]);
          setPage(1);
          setHasMore(true);
        }}
      />

      {/* Details Dialog */}
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
              <p>
                <span className="font-semibold">Department Name:</span>{" "}
                {viewingDepartment.department_name}
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
            
           <div className="flex justify-end pt-4">
          <Button
            className="bg-blue-900 text-white hover:bg-blue-700"
            onClick={() => {
              setEditingDepartment(viewingDepartment);
              setViewingDepartment(null); // close view dialog
            }}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit Department
          </Button>
        </div>
      </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
