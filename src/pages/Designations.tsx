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

const Designations = () => {
  const { user } = useLogin();
  const { toast } = useToast();

  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [sortOption, setSortOption] = useState<'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'>('id-desc');

  // Infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const departmentFilter = params.get('department');
  const departmentId = departmentFilter ? Number(departmentFilter) : null;

  if (!user) return <Navigate to="/login" replace />;

  // Fetch designations
  const fetchDesignations = async (pageNum = 1) => {
    setLoading(true);
    try {
      const from = (pageNum - 1) * pageSize;
      const to = pageNum * pageSize - 1;

      const { data: desData, error: desError } = await supabase
        .from('tbldesignations')
        .select('*')
        .range(from, to)
        .order('designation_id', { ascending: sortOption.includes('asc') });

      if (desError) throw desError;

      const deptIds = desData.map(d => d.department_id).filter(Boolean) as number[];

      const { data: deptData } = await supabase
        .from('tbldepartments')
        .select('*')
        .in('department_id', deptIds);

      const { data: empData } = await supabase
        .from('tblemployees')
        .select('employee_id, designation_id')
        .in('designation_id', desData.map(d => d.designation_id));

      const enriched = desData.map(d => ({
        ...d,
        total_employees: empData?.filter(e => e.designation_id === d.designation_id).length || 0,
      }));

      setDepartments(deptData || []);
      setDesignations(prev => pageNum === 1 ? enriched : [...prev, ...enriched]);
      if (enriched.length < pageSize) setHasMore(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Unable to fetch designations',
        variant: 'destructive',
      });
      setHasMore(false);
    } finally {
      setLoading(false);
      setSelectionLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading]);

  const handleDelete = async (id: number) => {
    try {
      const { count } = await supabase
        .from('tblemployees')
        .select('employee_id', { count: 'exact', head: true })
        .eq('designation_id', id);

      if (count && count > 0) {
        toast({
          title: 'Cannot delete',
          description: `This designation has ${count} active employee(s). Reassign them first.`,
          variant: 'destructive',
        });
        return;
      }

      if (!confirm('Are you sure you want to delete this designation?')) return;

      const { error } = await supabase
        .from('tbldesignations')
        .delete()
        .eq('designation_id', id);

      if (error) throw error;

      toast({ title: 'Deleted', description: 'Designation removed successfully.' });

      setDesignations([]);
      setPage(1);
      setHasMore(true);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Something went wrong while deleting designation.',
        variant: 'destructive',
      });
    }
  };

  const filtered = designations
    .filter(d => d.designation_title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(d => departmentId ? d.department_id === departmentId : true);

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === 'id-asc') return a.designation_id - b.designation_id;
    if (sortOption === 'id-desc') return b.designation_id - a.designation_id;
    if (sortOption === 'name-asc') return a.designation_title.localeCompare(b.designation_title);
    if (sortOption === 'name-desc') return b.designation_title.localeCompare(a.designation_title);
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="container mx-auto px-4 py-2 flex-1 flex flex-col">
        <Card className="w-full border-0 shadow-none bg-transparent flex-1 flex flex-col">
          <CardHeader className="px-0 py-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-2xl font-bold">
                {departmentId ? `Designations : ${departments.find(d => d.department_id === departmentId)?.department_name}` : 'Designations'}
              </CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    placeholder="Search designation"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectionLoading(true);
                      setPage(1);
                      setHasMore(true);
                    }}
                    className="pl-10 text-black bg-white border border-gray-300 shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setShowNewDialog(true)} className="bg-[#001F7A] text-white hover:bg-[#0029b0]">
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-[#001F7A] text-white hover:bg-[#0029b0]">
                        Sort <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white" style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }}>
                      <DropdownMenuItem onClick={() => setSortOption('name-asc')}>Name A - Z</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('name-desc')}>Name Z - A</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('id-asc')}>Old → New</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('id-desc')}>New → Old</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0 flex-1 flex flex-col overflow-hidden relative">
            {selectionLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
                Loading...
              </div>
            )}
            <div className="border rounded-lg overflow-auto flex-1">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Designation</TableHead>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold text-center">Active Employees</TableHead>
                    <TableHead className="font-bold text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(d => (
                    <TableRow key={d.designation_id}>
                      <TableCell>{d.designation_title}</TableCell>
                      <TableCell>{departments.find(dep => dep.department_id === d.department_id)?.department_name || 'Not Assigned'}</TableCell>
                      <TableCell className="text-center">
                        {d.total_employees! > 0 ? (
                          <Link to={`/employees?designation=${d.designation_id}`} className="text-gray-900 hover:text-blue-900 hover:underline">
                            {d.total_employees}
                          </Link>
                        ) : <span>0</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-end space-x-3">
                          <Button size="sm" className="bg-blue-900 text-white hover:bg-blue-700" onClick={() => setEditingDesignation(d)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" className="bg-blue-900 text-white hover:bg-blue-700" onClick={() => handleDelete(d.designation_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && sorted.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-3 text-muted-foreground">
                        {searchTerm ? 'No designations match your search.' : 'No designations found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer loader */}
            <div ref={loaderRef} className="sticky bottom-0 bg-background py-2 text-center text-sm text-gray-600">
              {loading ? 'Loading more designations...' : hasMore ? 'Scroll down to load more' : 'No more designations'}
            </div>
          </CardContent>
        </Card>
      </main>

      <EditDesignationDialog
        designation={editingDesignation}
        open={!!editingDesignation}
        onOpenChange={(open) => !open && setEditingDesignation(null)}
        onSuccess={() => {
          setDesignations([]);
          setPage(1);
          setHasMore(true);
        }}
        departments={departments}
      />
      <NewDesignationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={() => {
          setDesignations([]);
          setPage(1);
          setHasMore(true);
        }}
        departmets={departments}
      />
    </div>
  );
};

export default Designations;
