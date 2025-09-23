import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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

interface Designation {
  designation_id: number;
  designation_title: string;
  department_id: number | null;
}

interface Department {
  department_id: number;
  department_name: string;
}

const Designations = () => {
  const { user } = useAuth();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();

  // ⭐ Sorting and pagination state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  if (!user) return <Navigate to="/auth" replace />;

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const [designationsResult, departmentsResult] = await Promise.all([
        supabase.from('tbldesignations').select('*'),
        supabase.from('tbldepartments').select('*').order('department_name'),
      ]);

      if (designationsResult.error) throw designationsResult.error;
      if (departmentsResult.error) throw departmentsResult.error;

      setDesignations(designationsResult.data || []);
      setDepartments(departmentsResult.data || []);
    } catch (error) {
      toast({
        title: "Data Loading Issue",
        description: "Unable to fetch designation information",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (designationId: number) => {
    if (!confirm('Are you sure you want to remove this designation?')) return;
    try {
      const { error } = await supabase
        .from('tbldesignations')
        .delete()
        .eq('designation_id', designationId);

      if (error) throw error;

      toast({ title: "Success", description: "Designation removed successfully" });
      fetchDesignations();
    } catch (error) {
      toast({ title: "Removal Issue", description: "Unable to remove designation", variant: "default" });
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Not Assigned';
    const dept = departments.find(d => d.department_id === departmentId);
    return dept?.department_name || 'Unknown';
  };

  // ⭐ Filtering
  const filteredDesignations = designations.filter(designation =>
    designation.designation_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ⭐ Sorting by designation title
  const sortedDesignations = [...filteredDesignations].sort((a, b) => {
    if (a.designation_title.toLowerCase() < b.designation_title.toLowerCase()) return sortOrder === 'asc' ? -1 : 1;
    if (a.designation_title.toLowerCase() > b.designation_title.toLowerCase()) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // ⭐ Pagination
  const totalPages = Math.ceil(sortedDesignations.length / pageSize);
  const paginatedDesignations = sortedDesignations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <div className="flex justify-center p-8">Loading designations...</div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="px-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Designations</CardTitle>
              
            </div>
          </CardHeader>

          <CardContent className="px-0">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                  <Input
                    placeholder="Search designation"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-black placeholder-black bg-white border border-gray-400 shadow-sm"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    onClick={() => setShowNewDialog(true)}
                    className="bg-[#001F7A] text-white hover:bg-[#0029b0] hover:text-white transition"
                    title="clcik on the button for adding designations"   
                       >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Designation 
                  </Button>
                {/* ⭐ Sort Button */}
                          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#001F7A] text-white hover:bg-[#0029b0] hover:text-white transition" title="click on the button for sorting the designation">
                Sort 
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem onClick={() => setSortOrder('asc')}>A - Z</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('desc')}>Z - A</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
              </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Designation </TableHead>
                      <TableHead className="font-bold">Department </TableHead>
                      <TableHead className="font-bold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedDesignations.map((designation) => (
                      <TableRow key={designation.designation_id}>
                        <TableCell className="font-medium">{designation.designation_title}</TableCell>
                        <TableCell>{getDepartmentName(designation.department_id)}</TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              title="click on the button  for editing"
                              className="bg-blue-900 text-white hover:bg-blue-700"
                              onClick={() => setEditingDesignation(designation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="clcik on the button for deleting the designation"
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

              {paginatedDesignations.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  {searchTerm ? 'No designations found matching your search.' : 'No designations found.'}
                </div>
              )}

              {/* ⭐ Pagination */}
              <div className="flex justify-center items-center mt-4 space-x-4">
                <Button
                 size="sm"
                 title="click on the button for previous button "
                 disabled={currentPage === 1}
                 onClick={() => setCurrentPage((p) => p - 1)}
                 className="bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Previous
                </Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button
                 size="sm"
                 title="clcik on the button for next button "
                 disabled={currentPage === totalPages}
                 onClick={() => setCurrentPage((p) => p + 1)}
                 className="bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
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
    </div>
  );
};

export default Designations;
