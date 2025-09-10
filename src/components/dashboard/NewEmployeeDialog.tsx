import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface NewEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Designation {
  designation_id: number;
  designation_title: string;
}

export const NewEmployeeDialog = ({ open, onOpenChange }: NewEmployeeDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [designationId, setDesignationId] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const checkEmailExists = async (email: string) => {
    if (!email || email.length < 3) {
      setEmailExists('');
      return;
    }

    try {
      const { data } = await supabase
        .from('tblemployees')
        .select('employee_id, first_name, last_name')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (data) {
        setEmailExists(`This email is already registered to ${data.first_name} ${data.last_name}`);
      } else {
        setEmailExists('');
      }
    } catch (error) {
      console.warn('Email check issue:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [departmentsResult, designationsResult] = await Promise.all([
        supabase.from('tbldepartments').select('*').order('department_name'),
        supabase.from('tbldesignations').select('*').order('designation_title')
      ]);

      if (departmentsResult.error) throw departmentsResult.error;
      if (designationsResult.error) throw designationsResult.error;

      setDepartments(departmentsResult.data || []);
      setDesignations(designationsResult.data || []);
    } catch (error) {
      toast({
        title: "Data Loading Issue",
        description: "Unable to fetch departments and designations",
        variant: "default"
      });
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setHireDate('');
    setSalary('');
    setDepartmentId('');
    setDesignationId('');
    setEmailExists('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emailExists) {
      toast({
        title: "Email Already Exists",
        description: emailExists,
        variant: "default",
      });
      return;
    }

    // Validate salary limit
    const salaryValue = salary ? parseFloat(salary) : 0;
    if (salaryValue > 10000000) {
      toast({
        title: "Salary Limit Exceeded",
        description: "Salary cannot exceed ₹1,00,00,000",
        variant: "default",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('tblemployees')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          hire_date: hireDate,
          salary: salary ? parseFloat(salary) : null,
          department_id: departmentId ? parseInt(departmentId) : null,
          designation_id: designationId ? parseInt(designationId) : null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee added successfully",
      });

      resetForm();
      onOpenChange(false);
      window.location.reload(); // Refresh to show new data
    } catch (error) {
      toast({
        title: "Addition Issue",
        description: "Unable to add employee",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the employee details below to add them to the system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                checkEmailExists(e.target.value);
              }}
              required
            />
            {emailExists && (
              <p className="text-sm text-orange-600">{emailExists}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salary (₹)</Label>
            <Input
              id="salary"
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              max="10000000"
              placeholder="Maximum ₹1,00,00,000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation (Optional)</Label>
              <Select value={designationId} onValueChange={setDesignationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((designation) => (
                    <SelectItem key={designation.designation_id} value={designation.designation_id.toString()}>
                      {designation.designation_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!emailExists}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};