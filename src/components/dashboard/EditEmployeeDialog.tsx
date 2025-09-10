import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  salary: number | null;
  department_id: number | null;
  designation_id: number | null;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Designation {
  designation_id: number;
  designation_title: string;
}

interface EditEmployeeDialogProps {
  employee: Employee | null;
  departments: Department[];
  designations: Designation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditEmployeeDialog = ({ 
  employee, 
  departments, 
  designations, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditEmployeeDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [designationId, setDesignationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name);
      setLastName(employee.last_name);
      setEmail(employee.email);
      setHireDate(employee.hire_date);
      setSalary(employee.salary?.toString() || '');
      setDepartmentId(employee.department_id?.toString() || '');
      setDesignationId(employee.designation_id?.toString() || '');
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    
    setLoading(true);

    try {
      const employeeData = {
        first_name: firstName,
        last_name: lastName,
        email,
        hire_date: hireDate,
        salary: salary ? parseFloat(salary) : null,
        department_id: departmentId ? parseInt(departmentId) : null,
        designation_id: designationId ? parseInt(designationId) : null
      };

      const { error } = await supabase
        .from('tblemployees')
        .update(employeeData)
        .eq('employee_id', employee.employee_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
<<<<<<< HEAD
        title: "Update Issue",
        description: "Failed to update employee",
        variant: "default"
=======
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive"
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update the employee details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
<<<<<<< HEAD
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]} // today's date
                      required
                    />
                  </div>
          
=======
            <Label htmlFor="hireDate">Hire Date *</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              required
            />
          </div>
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd

          <div className="space-y-2">
            <Label htmlFor="salary">Salary</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Enter salary amount"
            />
          </div>

<<<<<<< HEAD
          <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
=======
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
<<<<<<< HEAD
              <SelectContent className="z-50 bg-white shadow-lg">
                {departments.map((dept) => (
                  <SelectItem
                    key={dept.department_id}
                    value={dept.department_id.toString()}
                  >
=======
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
                    {dept.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
<<<<<<< HEAD
          </div>

          <div className="space-y-2 relative z-10">
              <Label htmlFor="designation">Designation (Optional)</Label>
              <Select value={designationId} onValueChange={setDesignationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white shadow-lg">
                  {designations.map((designation) => (
                    <SelectItem
                      key={designation.designation_id}
                      value={designation.designation_id.toString()}
                    >
                      {designation.designation_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
=======

          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
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
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};