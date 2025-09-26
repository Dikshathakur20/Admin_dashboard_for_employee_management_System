// inside NewEmployeeDialog.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// ...interfaces stay the same

export const NewEmployeeDialog = ({ open, onOpenChange, onEmployeeAdded }: NewEmployeeDialogProps) => {
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
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const { toast } = useToast();
  const buttonPressCount = useRef(0); // track double enter for buttons

  // Utility: capitalize each word
  const capitalizeWords = (val: string) =>
    val.replace(/\b\w/g, (c) => c.toUpperCase());

  // ... fetchData, checkEmailExists, resetForm, handleSubmit stay as-is

  // ----------- Navigation Handler ----------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const form = target.closest("form");
      if (!form) return;

      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          "input, select, textarea, button, [tabindex]:not([tabindex='-1'])"
        )
      ).filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);

      const index = focusable.indexOf(target);

      if (e.key === "Enter") {
        if (target.tagName === "BUTTON") {
          e.preventDefault();
          buttonPressCount.current += 1;
          if (buttonPressCount.current === 2) {
            (target as HTMLButtonElement).click();
            buttonPressCount.current = 0;
          }
          return;
        }

        if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "file") {
          e.preventDefault();
          (target as HTMLInputElement).click(); // open file dialog
          return;
        }

        e.preventDefault();
        buttonPressCount.current = 0; // reset if moving
        const next = focusable[index + 1];
        if (next) next.focus();
      }

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = focusable[index + 1];
        if (next) next.focus();
      }

      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = focusable[index - 1];
        if (prev) prev.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  // -----------------------------------------

  const filteredDesignations = departmentId
    ? designations.filter(d => d.department_id === parseInt(departmentId))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white text-black rounded-xl shadow-lg border border-gray-200"
        style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6"
          style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}>
          
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                maxLength={25}
                onChange={(e) => {
                  if (/^[A-Za-z ]*$/.test(e.target.value)) {
                    setFirstName(capitalizeWords(e.target.value));
                  }
                }}
                onPaste={(e) => e.preventDefault()} // prevent paste
                required
                className="border border-blue-500 focus:ring-2 focus:ring-blue-600 bg-blue-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                maxLength={25}
                onChange={(e) => {
                  if (/^[A-Za-z ]*$/.test(e.target.value)) {
                    setLastName(capitalizeWords(e.target.value));
                  }
                }}
                onPaste={(e) => e.preventDefault()}
                required
                className="border border-blue-500 focus:ring-2 focus:ring-blue-600 bg-blue-50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value.toLowerCase()); checkEmailExists(e.target.value); }}
              onPaste={(e) => e.preventDefault()} // prevent paste
              required
              className="border border-blue-500 focus:ring-2 focus:ring-blue-600 bg-blue-50"
            />
            {emailExists && <p className="text-sm text-orange-600">{emailExists}</p>}
          </div>

          {/* Hire Date */}
          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              min="2000-01-01" // cannot go before 2000
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setHireDate(e.target.value)}
              required
              className="border border-blue-500 focus:ring-2 focus:ring-blue-600 bg-blue-50"
            />
          </div>

          {/* Department & Designation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={departmentId}
                onValueChange={(val) => { setDepartmentId(val); setDesignationId(''); }}
                required
              >
                <SelectTrigger className="w-full bg-blue-900 text-white hover:bg-blue-700">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white shadow-lg">
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept.department_id}
                      value={dept.department_id.toString()}
                      className="hover:bg-blue-100 focus:bg-blue-200" // highlight
                    >
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Select
                value={designationId}
                onValueChange={setDesignationId}
                required
                disabled={!departmentId || filteredDesignations.length === 0}
              >
                <SelectTrigger className="w-full bg-blue-900 text-white hover:bg-blue-700">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white shadow-lg">
                  {filteredDesignations.map((des) => (
                    <SelectItem
                      key={des.designation_id}
                      value={des.designation_id.toString()}
                      className="hover:bg-blue-100 focus:bg-blue-200"
                    >
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
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline"
              onClick={() => { onOpenChange(false); resetForm(); }}
              className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-900 text-white hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewEmployeeDialog;
