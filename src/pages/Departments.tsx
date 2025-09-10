import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EditDepartmentDialog } from '@/components/dashboard/EditDepartmentDialog';
import { NewDepartmentDialog } from '@/components/dashboard/NewDepartmentDialog';

interface Department {
  department_id: number;
  department_name: string;
  location: string | null;
}

const Departments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tbldepartments')
        .select('*')
        .order('department_id', { ascending: false });

      if (error) throw error;
      setDepartments(data || []);
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

  const filteredDepartments = departments.filter(department =>
    department.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (department.location && department.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading departments...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Department Management</h1>
                <p className="text-sm text-muted-foreground">Manage all departments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Department Records</CardTitle>
                <CardDescription>
                  View and manage all department information
                </CardDescription>
              </div>
              <Button onClick={() => setShowNewDialog(true)} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
<<<<<<< HEAD
                    placeholder="Search department"
=======
                    placeholder="Search departments..."
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Department Name</TableHead>
                      <TableHead className="font-bold">Location</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((department) => (
                      <TableRow key={department.department_id}>
                        <TableCell className="font-medium">{department.department_name}</TableCell>
<<<<<<< HEAD
                        <TableCell>{department.location || '-'}</TableCell>

=======
                        <TableCell>{department.location || 'Not Specified'}</TableCell>
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingDepartment(department)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
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

              {filteredDepartments.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  {searchTerm ? 'No departments found matching your search.' : 'No departments found.'}
                </div>
              )}
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
    </div>
  );
};

export default Departments;