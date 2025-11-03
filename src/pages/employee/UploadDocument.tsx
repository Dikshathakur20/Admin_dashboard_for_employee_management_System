import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const UploadDocument = () => {
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [designation, setDesignation] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // ✅ Fetch employee info from localStorage
 useEffect(() => {
  const storedEmployee = localStorage.getItem("employee");

  if (storedEmployee) {
    try {
      const parsed = JSON.parse(storedEmployee);
      if (parsed.employee_id) setEmployeeId(parsed.employee_id);
      if (parsed.department_id) setDepartment(parsed.department_id);
      if (parsed.designation_id) setDesignation(parsed.designation_id);
      console.log("Employee loaded from localStorage:", parsed);
    } catch (err) {
      console.error("Error parsing employee from localStorage:", err);
    }
  } else {
    console.warn("No employee data found in localStorage");
  }
}, []);


  // ✅ Upload logic
  const handleUpload = async () => {
    if (!file || !category) {
      toast({
        title: "Missing fields",
        description: "Please select both a file and a category.",
      });
      return;
    }

    if (!employeeId || !department || !designation) {
      toast({
        title: "Employee info missing",
        description:
          "Could not find employee details in local storage. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Convert file to Base64
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

      const fileBase64 = await toBase64(file);

      // ✅ Insert into tbldocuments
      const { error: dbError } = await supabase.from("tbldocuments").insert([
        {
          employee_id: employeeId,
          department,
          designation,
          category,
          file_name: file.name,
          file_url: fileBase64,
          uploaded_by: "Employee",
        },
      ]);

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Document uploaded and stored successfully.",
      });

      setFile(null);
      setCategory("");
    } catch (error: any) {
      console.error("Upload failed:", error.message);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow flex items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm"
          style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
        >
          <h2 className="text-2xl font-bold text-[#001F7A] mb-6 text-center">
            Upload Your Document
          </h2>

          <div className="space-y-5">
            <div>
              <label className="text-[#001F7A] font-medium text-sm mb-1 block">
                Select Document Category
              </label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="w-full border-[#001F7A] text-[#001F7A] focus:ring-[#001F7A] focus:ring-1">
                  <SelectValue placeholder="Choose Document Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#001F7A] text-white border-none shadow-lg">
                  <SelectItem value="education">
                    Education Qualification
                  </SelectItem>
                  <SelectItem value="skills">Skill Set Document</SelectItem>
                  <SelectItem value="personal">Personal Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[#001F7A] font-medium text-sm mb-1 block">
                Choose PDF File
              </label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border-[#001F7A] text-[#001F7A]"
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-[#001F7A] hover:bg-[#001F7A]/90 text-white font-semibold py-2 rounded-lg transition duration-200 mt-3"
            >
              {loading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-gray-600 text-sm border-t border-gray-200">
        © {new Date().getFullYear()} Anthem InfoTech Pvt. Ltd. | Employee Portal
      </footer>
    </div>
  );
};

export default UploadDocument;
