import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface NewDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const NewDepartmentDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: NewDepartmentDialogProps) => {
  const [departmentName, setDepartmentName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setDepartmentName('');
    setLocation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert department into Supabase; store null if location is empty
      const { error } = await supabase
        .from('tbldepartments')
        .insert({
          department_name: departmentName,
          location: location || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department added successfully",
      });
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Adding Issue",
        description: "Failed to add department",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white text-black rounded-xl shadow-lg border border-gray-200">
        <DialogHeader>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogDescription>
            Enter the department details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="space-y-2">
            <Label htmlFor="departmentName">Department Name *</Label>
            <Input
              id="departmentName"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
          </div>

                <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location || '-'} // Show '-' if empty
            onChange={(e) => setLocation(e.target.value === '-' ? '' : e.target.value)} // Prevent user typing '-' manually
            placeholder="Enter department location"
          />
        </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
