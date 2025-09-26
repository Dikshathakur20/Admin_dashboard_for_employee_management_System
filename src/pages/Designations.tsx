import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2,ChevronDown } from 'lucide-react';
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

type SortOption = 'name-asc' | 'name-desc' | 'id-asc' | 'id-desc';

const Designations = () => {
  const { user } = useAuth();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();

  const [sortOption, setSortOption] = useState<SortOption>('id-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
    } catch {
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
    } catch {
      toast({ title: "Removal Issue", description: "Unable to remove designation", variant: "default" });
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Not Assigned';
    const dept = departments.find(d => d.department_id === departmentId);
    return dept?.department_name || 'Unknown';
  };

  const filteredDesignations = designations.filter(designation =>
    designation.designation_title.toLowerCase().includes(searchTerm.toLowerCase())
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

  const totalPages = Math.ceil(sortedDesignations.length / pageSize);
  const paginatedDesignations = sortedDesignations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <div className="flex justify-center p-8">Loading designations...</div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-2">
  <Card className="w-full border-0 shadow-none bg-transparent">
    {/* Header with Title + Search + Actions */}
    <CardHeader className="px-0 py-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <CardTitle className="text-2xl font-bold">Designations</CardTitle>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
            <Input
              placeholder="Search designation"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 text-black bg-white border border-gray-300 shadow-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2"
          title="Add designation">
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-[#001F7A] text-white hover:bg-[#0029b0]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#001F7A] text-white hover:bg-[#0029b0]" title="Sort"  >
                  Sort
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white" style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }} >
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
            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table className="table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Designation</TableHead>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedDesignations.map((designation) => (
                    <TableRow key={designation.designation_id}>
                      <TableCell className="font-medium">{designation.designation_title}</TableCell>
                      <TableCell>{getDepartmentName(designation.department_id)}</TableCell>
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

            {paginatedDesignations.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                {searchTerm ? 'No designations found matching your search.' : 'No designations found.'}
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center mt-4 space-x-4">
              <Button
                size="sm"
                title="Previous page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Previous
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button
                size="sm"
                title="Next page"
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
