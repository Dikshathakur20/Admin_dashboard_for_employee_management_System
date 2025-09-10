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
import { EditDesignationDialog } from '@/components/dashboard/EditDesignationDialog';
import { NewDesignationDialog } from '@/components/dashboard/NewDesignationDialog';

interface Designation {
  designation_id: number;
  designation_title: string;
}

const Designations = () => {
  const { user } = useAuth();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tbldesignations')
        .select('*')
        .order('designation_id', { ascending: false });

      if (error) throw error;
      setDesignations(data || []);
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

      toast({
        title: "Success",
        description: "Designation removed successfully",
      });
      fetchDesignations();
    } catch (error) {
      toast({
        title: "Removal Issue",
        description: "Unable to remove designation",
        variant: "default"
      });
    }
  };

  const filteredDesignations = designations.filter(designation =>
    designation.designation_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
<<<<<<< HEAD
    return <div className="flex justify-center p-8">Loading designation</div>;
=======
    return <div className="flex justify-center p-8">Loading designations...</div>;
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
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
                <h1 className="text-xl font-bold">Designation Management</h1>
                <p className="text-sm text-muted-foreground">Manage all job designations</p>
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
                <CardTitle>Designation Records</CardTitle>
                <CardDescription>
                  View and manage all job designations
                </CardDescription>
              </div>
              <Button onClick={() => setShowNewDialog(true)} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Designation
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
                    placeholder="Search designation"
=======
                    placeholder="Search designations..."
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
                      <TableHead className="font-bold">Designation Title</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDesignations.map((designation) => (
                      <TableRow key={designation.designation_id}>
                        <TableCell className="font-medium">{designation.designation_title}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingDesignation(designation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
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

              {filteredDesignations.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  {searchTerm ? 'No designations found matching your search.' : 'No designations found.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <EditDesignationDialog
        designation={editingDesignation}
        open={!!editingDesignation}
        onOpenChange={(open) => !open && setEditingDesignation(null)}
        onSuccess={fetchDesignations}
      />

      <NewDesignationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={fetchDesignations}
      />
    </div>
  );
};

export default Designations;