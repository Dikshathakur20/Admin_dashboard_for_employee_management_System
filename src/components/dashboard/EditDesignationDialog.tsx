import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Designation {
  designation_id: number;
  designation_title: string;
}

interface EditDesignationDialogProps {
  designation: Designation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditDesignationDialog = ({ 
  designation, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditDesignationDialogProps) => {
  const [designationTitle, setDesignationTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (designation) {
      setDesignationTitle(designation.designation_title);
    }
  }, [designation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tbldesignations')
        .update({
          designation_title: designationTitle
        })
        .eq('designation_id', designation.designation_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Designation updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update Issue",
        description: "Failed to update designation",
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
          <DialogTitle>Edit Designation</DialogTitle>
          <DialogDescription>
            Update the designation details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow-md p-6 border border-gray-200">
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
              Update Designation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};