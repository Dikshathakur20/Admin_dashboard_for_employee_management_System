import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { setupKeyboardNavigation } from './components/ui/KeyboardNavigation'; // <-- navigation utility

interface Employee { /* ... keep your interface ... */ }
interface Department { /* ... */ }
interface Designation { /* ... */ }
interface EditEmployeeDialogProps { /* ... */ }

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
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // -------------------- NAVIGATION REFS --------------------
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const hireDateRef = useRef<HTMLInputElement>(null);
  const salaryRef = useRef<HTMLInputElement>(null);
  const departmentRef = useRef<HTMLSelectElement>(null);
  const designationRef = useRef<HTMLSelectElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const updateButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!open) setProfilePicture(null);
  }, [open]);

  // -------------------- INITIALIZE NAVIGATION --------------------
  useEffect(() => {
    setupKeyboardNavigation(
      [
        firstNameRef,
        lastNameRef,
        emailRef,
        hireDateRef,
        salaryRef,
        departmentRef,
        designationRef,
        fileRef
      ],
      { addButton: updateButtonRef, cancelButton: cancelButtonRef }
    );
  }, []);

  // -------------------- FILE TO BASE64 --------------------
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => { /* ... keep your handleSubmit code ... */ }

  const filteredDesignations = designations.filter(
    (d) => d.department_id === Number(departmentId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white text-black rounded-xl shadow-lg border border-gray-200" style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                ref={firstNameRef} // <-- ref added
                value={firstName}
                maxLength={25}
                className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
                onChange={(e) =>
                  /^[A-Za-z ]*$/.test(e.target.value) &&
                  setFirstName(
                    e.target.value.replace(/\b\w/g, (char) => char.toUpperCase())
                  )
                }
                onPaste={(e) => e.preventDefault()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                ref={lastNameRef} // <-- ref added
                value={lastName}
                maxLength={25}
                className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
                onChange={(e) =>
                  /^[A-Za-z ]*$/.test(e.target.value) &&
                  setLastName(
                    e.target.value.replace(/\b\w/g, (char) => char.toUpperCase())
                  )
                }
                onPaste={(e) => e.preventDefault()}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              ref={emailRef} // <-- ref added
              type="email"
              value={email}
              className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              onPaste={(e) => e.preventDefault()}
              required
            />
          </div>

          {/* Hire Date */}
          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              ref={hireDateRef} // <-- ref added
              type="date"
              value={hireDate}
              className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
              onChange={(e) => setHireDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              min="2000-01-01"
              required
            />
          </div>

          {/* Salary */}
          <div className="space-y-2">
            <Label htmlFor="salary">Salary</Label>
            <Input
              id="salary"
              ref={salaryRef} // <-- ref added
              type="number"
              step="0.01"
              value={salary}
              placeholder="Enter salary (max 10,000,000)"
              required
              className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value <= 10000000) setSalary(e.target.value);
                else if (e.target.value === '') setSalary('');
              }}
            />
          </div>

          {/* Department & Designation */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                ref={departmentRef} // <-- ref added
                value={departmentId}
                onValueChange={(val) => {
                  setDepartmentId(val);
                  if (!filteredDesignations.find(d => d.designation_id === parseInt(designationId || '0'))) {
                    setDesignationId('');
                  }
                }}
              >
                <SelectTrigger className="w-full bg-blue-900 text-white hover:bg-blue-700">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white shadow-lg">
                  {departments.map((dept) => (
                    <SelectItem key={dept.department_id} value={dept.department_id.toString()} className="hover:bg-blue-100 focus:bg-blue-200 cursor-pointer">
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Select
                ref={designationRef} // <-- ref added
                value={designationId || ''}
                onValueChange={setDesignationId}
                disabled={!departmentId || filteredDesignations.length === 0}
              >
                <SelectTrigger className="w-full bg-blue-900 text-white hover:bg-blue-700">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white shadow-lg">
                  {filteredDesignations.map((des) => (
                    <SelectItem key={des.designation_id} value={des.designation_id.toString()} className="hover:bg-blue-100 focus:bg-blue-200 cursor-pointer">
                      {des.designation_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Profile Picture */}
          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <Input
              id="profilePicture"
              ref={fileRef} // <-- ref added
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
            />
          </div>

          {/* Footer */}
          <DialogFooter className="flex justify-end gap-2">
            <Button
              ref={cancelButtonRef} // <-- ref added
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
            >
              Cancel
            </Button>

            <Button
              ref={updateButtonRef} // <-- ref added
              type="submit"
              disabled={loading}
              className="bg-blue-900 text-white hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
