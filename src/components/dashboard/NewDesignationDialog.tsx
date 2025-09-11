import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface NewDesignationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const NewDesignationDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: NewDesignationDialogProps) => {
  const [designationTitle, setDesignationTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setDesignationTitle('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tbldesignations')
        .insert({
          designation_title: designationTitle
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Designation added successfully",
      });
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Adding Issue",
        description: "Failed to add designation",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Designation</DialogTitle>
          <DialogDescription>
            Enter the designation details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="designationTitle">Designation Title *</Label>
            <Input
              id="designationTitle"
              value={designationTitle}
              onChange={(e) => setDesignationTitle(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Designation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};