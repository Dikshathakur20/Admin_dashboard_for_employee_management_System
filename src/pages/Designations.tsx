'use client';

import { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useLogin } from '@/contexts/LoginContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EditDesignationDialog } from '@/components/dashboard/EditDesignationDialog';
import { NewDesignationDialog } from '@/components/dashboard/NewDesignationDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Designation {
  designation_id: number;
  designation_title: string;
  department_id: number | null;
  total_employees?: number;
}

interface Department {
  department_id: number;
  department_name: string;
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

type SortOption = 'name-asc' | 'name-desc' | 'id-asc' | 'id-desc';

const Designations = () => {
  const { user } = useLogin();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const [sortOption, setSortOption] = useState<SortOption>('id-desc');

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const departmentFilter = params.get("department");

  if (!user) return <Navigate to="/login" replace />;

  // Fetch designations
  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const [designationsResult, departmentsResult, employeesResult] = await Promise.all([
        supabase.from('tbldesignations').select('*'),
        supabase.from('tbldepartments').select('*').order('department_name'),
        supabase.from('tblemployees').select('employee_id, designation_id')
      ]);

      if (designationsResult.error) throw designationsResult.error;
      if (departmentsResult.error) throw departmentsResult.error;
      if (employeesResult.error) throw employeesResult.error;

      setDepartments(departmentsResult.data || []);

      const designationsWithCount = (designationsResult.data || []).map(des => ({
        ...des,
        total_employees: employeesResult.data?.filter(
          (e: Employee) => e.designation_id === des.designation_id
        ).length || 0
      }));

      setDesignations(designationsWithCount);
    } ;
    catch (err) {
      if (typeof window !== 'undefined') {
        toast({
          title: "Data Loading Issue",
          description: "Unable to fetch designation information",
          variant: "default"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (designationId: number) => {
    if (typeof window === 'undefined') return;
    try {
      const { count, error: countError } = await supabase
        .from("tblemployees")
        .select("employee_id", { count: "exact", head: true })
        .eq("designation_id", designationId);

      if (countError) throw countError;

      if (count && count > 0) {
        toast({
          title: "Cannot delete",
          description: `This designation has ${count} active employee(s). Reassign them first.`,
          variant: "destructive",
        });
        return;
      }

      setConfirmDelete(designationId);
    };
    catch (err) {
      if (typeof window !== 'undefined') {
        toast({
          title: "Error",
          description: "Something went wrong while checking designation dependencies.",
          variant: "destructive",
        });
      }
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    if (typeof window === 'undefined') return;

    try {
      const { error } = await supabase
        .from("tbldesignations")
        .delete()
        .eq("designation_id", confirmDelete);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Designation removed successfully",
      });

      fetchDesignations();
    }; 
    catch (err) {
      toast({
        title: "Deletion Failed",
        description: "Unable to remove designation.",
        variant: "destructive",
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Not Assigned';
    const dept = departments.find(d => d.department_id === departmentId);
    return dept?.department_name || 'Unknown';
  };

  // Filtering & sorting
  const filteredDesignations = designations
    .filter(designation =>
      designation.designation_title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(designation =>
      departmentFilter ? designation.department_id === Number(departmentFilter) : true
    );

  const sortedDesignations = [...filteredDesignations].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.designation_title.toLowerCase().localeCompare(b.designation_title.toLowerCase());
      case 'name-desc':
        return b.designation_title.toLowerCase().localeCompare(a.designation_title.toLowerCase());
      case 'id-asc':
        return a.designation_id - b.designation_id;
      case 'id-desc':
        return b.designation_id - a.designation_id;
      default:
        return 0;
    }
  });

  // Infinite scroll observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 10, sortedDesignations.length));
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [sortedDesignations.length]);

  const visibleDesignations = sortedDesignations.slice(0, visibleCount);

  if (loading) return <div className="flex justify-center p-8">Loading designations...</div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-2">
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 py-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-2xl font-bold">
                {departmentFilter
                  ? `Designation : ${getDepartmentName(Number(departmentFilter))} Department`
                  : "Designations"}
              </CardTitle>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    placeholder="Search designation"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setVisibleCount(10);
                    }}
                    className="pl-10 text-black bg-white border border-gray-300 shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2" title="Add designation">
                  <Button
                    onClick={() => setShowNewDialog(true)}
                    className="bg-[#001F7A] text-white hover:bg-[#0029b0]"
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
                    <DropdownMenuContent align="end" className="bg-white" style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }}>
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
            {departmentFilter && (
              <div className="mb-4">
                <Button
                  onClick={() => window.location.href = "/designations"}
                  title="Restore Designation"
                  className="bg-blue-600 text-white hover:bg-blue-800"
                >
                  All designations
                </Button>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <Table className="table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Designation</TableHead>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold text-center">Active Employees</TableHead>
                    <TableHead className="font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleDesignations.map((designation) => (
                    <TableRow key={designation.designation_id}>
                      <TableCell className="font-medium">{designation.designation_title}</TableCell>
                      <TableCell>{getDepartmentName(designation.department_id)}</TableCell>
                      <TableCell className="text-center">
                        {designation.total_employees && designation.total_employees > 0 ? (
                          <Link
                            to={`/employees?designation=${designation.designation_id}`}
                            className="text-gray-900 hover:text-blue-900 hover:underline transition-colors duration-200"
                          >
                            {designation.total_employees}
                          </Link>
                        ) : (
                          <span>0</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            title="Edit"
                            className="bg-blue-900 text-white hover:bg-blue-700"
                            onClick={() => setEditingDesignation(designation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Delete"
                            className="bg-blue-900 text-white hover:bg-blue-700"
                            onClick={() => handleDelete(designation.designation_id)}
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

            {visibleDesignations.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                {searchTerm ? 'No designations found matching your search.' : 'No designations found.'}
              </div>
            )}

            {visibleCount < sortedDesignations.length && (
              <div ref={loaderRef} className="text-center py-4 text-gray-600 text-sm">
                Loading more...
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <EditDesignationDialog
        designation={editingDesignation}
        open={!!editingDesignation}
        onOpenChange={(open) => !open && setEditingDesignation(null)}
        onSuccess={fetchDesignations}
        departments={departments}
      />

      <NewDesignationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={fetchDesignations}
        departments={departments}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this designation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDeleteAction}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Designations;
