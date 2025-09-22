import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Department {
  department_id: number;
  department_name: string;
}

interface NewDesignationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const NewDesignationDialog = ({ open, onOpenChange, onSuccess }: NewDesignationDialogProps) => {
  const [designationTitle, setDesignationTitle] = useState('');
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('tbldepartments')
        .select('*')
        .order('department_name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to fetch departments',
        variant: 'default',
      });
    }
  };

  const resetForm = () => {
    setDesignationTitle('');
    setDepartmentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      toast({
        title: 'Error',
        description: 'Please select a department',
        variant: 'default',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tbldesignations')
        .insert({
          designation_title: designationTitle,
          department_id: departmentId
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Designation added successfully',
        duration:2000
      });
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Adding Issue',
        description: 'Failed to add designation',
        variant: 'default',
        duration:2000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white text-black rounded-xl shadow-lg border border-gray-200">
        <DialogHeader>
          <DialogTitle>Add New Designation</DialogTitle>
          
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          {/* Department Dropdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departmentSelect">Department</Label>
                  <Select
                    value={departmentId !== null ? String(departmentId) : ''}
                    onValueChange={(val) => setDepartmentId(Number(val))}
                    required
                  >
                    <SelectTrigger className="w-full bg-blue-900 text-white hover:bg-blue-700">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white shadow-lg">
                      {departments.map((dept) => (
                        <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                          {dept.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                          <Label htmlFor="designationTitle">Designation</Label>
                          <Input
                            id="designationTitle"
                            value={designationTitle}
                            maxLength={50}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^[A-Za-z\s]*$/.test(value)) {
                                setDesignationTitle(value);
                              }
                            }}
                            required
                          />
                          {designationTitle.length === 50 && (
                            <p className="text-xs text-red-500">Maximum 50 characters allowed</p>
                          )}
                        </div>
              </div>



          {/* Buttons */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading} className="bg-blue-900 text-white hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Designation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default NewDesignationDialog;