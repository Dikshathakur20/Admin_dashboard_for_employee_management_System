import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EditDepartmentDialog } from '@/components/dashboard/EditDepartmentDialog';
import { NewDepartmentDialog } from '@/components/dashboard/NewDepartmentDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

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
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [departmentDesignations, setDepartmentDesignations] = useState<Designation[]>([]);
  const { toast } = useToast();

  // ⭐ Sorting and pagination state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  if (!user) return <Navigate to="/auth" replace />;

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tbldepartments')
        .select('*, tbldesignations (designation_id)');

      if (error) throw error;
     const enriched = (data || []).map((dept: any) => ({
      department_id: dept.department_id,
      department_name: dept.department_name,
      location: dept.location,
      total_designations: dept.tbldesignations ? dept.tbldesignations.length : 0
    }));
    setDepartments(enriched);
    } catch (error) {
      toast({
        title: "Data Loading Issue",
        description: "Unable to fetch department information",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (departmentId: number) => {
    if (!confirm('Are you sure you want to remove this department?')) return;
    try {
      const { error } = await supabase
        .from('tbldepartments')
        .delete()
        .eq('department_id', departmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department removed successfully",
      });
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Removal Issue",
        description: "Unable to remove department",
        variant: "default"
      });
    }
  };

  const fetchDepartmentDesignations = async (departmentId: number) => {
    try {
      const { data, error } = await supabase
        .from('tbldesignations')
        .select('*')
        .eq('department_id', departmentId)
        .order('designation_title');

      if (error) throw error;
      setDepartmentDesignations(data ||  []);
    } catch (error) {
      toast({
        title: "Data Loading Issue",
        description: "Unable to fetch designations for this department",
        variant: "default"
      });
      setDepartmentDesignations([]);
    }
  };

  // ⭐ Filtering
  const filteredDepartments = departments.filter(dept =>
    dept.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ⭐ Sorting
  const sortedDepartments = [...filteredDepartments].sort((a, b) => {
    if (a.department_name.toLowerCase() < b.department_name.toLowerCase()) return sortOrder === 'asc' ? -1 : 1;
    if (a.department_name.toLowerCase() > b.department_name.toLowerCase()) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // ⭐ Pagination
  const totalPages = Math.ceil(sortedDepartments.length / pageSize);
  const paginatedDepartments = sortedDepartments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <div className="flex justify-center p-8">Loading departments...</div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="px-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-2xl font-bold">Departments</CardTitle>
              </div>
              </CardHeader>
              <CardContent className="px-0">
                          <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                                <Input
                                  placeholder="Search department "
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-10 text-black placeholder-black bg-white border border-gray-400 shadow-sm"
                                />
                              </div>
                <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setShowNewDialog(true)} className="bg-[#001F7A] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>

                {/* ⭐ Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-[#001F7A] text-white">
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortOrder('asc')}>A - Z</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('desc')}>Z - A</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>

          <CardContent className="px-0">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Department </TableHead>
                    <TableHead className="font-bold text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDepartments.map((department) => (
                    <TableRow key={department.department_id}>
                      <TableCell>{department.department_name}</TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-900 text-white hover:bg-blue-700"
                            onClick={async () => {
                              await fetchDepartmentDesignations(department.department_id);
                              setViewingDepartment(department);
                            }}
                          >
                            <Eye className="h-4 w-4"/>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-900 text-white hover:bg-blue-700"
                            onClick={() => setEditingDepartment(department)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-900 text-white hover:bg-blue-700"
                            onClick={() => handleDelete(department.department_id)}
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

            {paginatedDepartments.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                {searchTerm ? 'No departments found matching your search.' : 'No departments found.'}
              </div>
            )}

            {/* ⭐ Pagination */}
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

      {/* Dialogs */}
      <EditDepartmentDialog
        department={editingDepartment}
        open={!!editingDepartment}
        onOpenChange={(open) => !open && setEditingDepartment(null)}
        onSuccess={fetchDepartments}
      />
      <NewDepartmentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={fetchDepartments}
      />

      {/* Department Details Dialog */}
      <Dialog open={!!viewingDepartment} onOpenChange={(open) => !open && setViewingDepartment(null)}>
        <DialogContent className="max-w-lg bg-blue-50 p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">Department Details</DialogTitle>
          </DialogHeader>
          {viewingDepartment && (
            <div className="space-y-3">
              <p><span className="font-semibold">Department Name:</span> {viewingDepartment.department_name}</p>
              <p><span className="font-semibold">Location:</span> {viewingDepartment.location || "-"}</p>
              <p><span className="font-semibold">Total Designations:</span> {departmentDesignations.length}</p>
              {departmentDesignations.length > 0 ? (
                <ul className="list-disc list-inside ml-4">
                  {departmentDesignations.map(des => <li key={des.designation_id}>{des.designation_title}</li>)}
                </ul>
              ) : <p>No designations found.</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
