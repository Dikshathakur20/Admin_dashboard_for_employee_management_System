import { useEffect, useState, useRef } from "react";
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
import { Eye, Trash2, FileText } from "lucide-react"; // ✅ Icons

const UploadDocument = () => {
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [designation, setDesignation] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Load employee info
  useEffect(() => {
    const storedEmployee = localStorage.getItem("employee");
    if (storedEmployee) {
      try {
        const parsed = JSON.parse(storedEmployee);
        if (parsed.employee_id) setEmployeeId(parsed.employee_id);
        if (parsed.department_id) setDepartment(parsed.department_id);
        if (parsed.designation_id) setDesignation(parsed.designation_id);
        console.log("Employee loaded:", parsed);
      } catch (err) {
        console.error("Error parsing employee:", err);
      }
    }
  }, []);

  // ✅ Fetch employee documents
  useEffect(() => {
    const fetchDocs = async () => {
      if (!employeeId) return;
      const { data, error } = await supabase
        .from("tbldocuments")
        .select("*")
        .eq("employee_id", employeeId)
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error.message);
      } else {
        setUploadedDocs(data || []);
      }
    };

    fetchDocs();
  }, [employeeId]);

  // ✅ Convert file to Base64
  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let result = reader.result as string;
        if (!result.startsWith("data:application/pdf")) {
          result = `data:application/pdf;base64,${result.split(",")[1]}`;
        }
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });

  // ✅ Upload new document
  const handleUpload = async () => {
    if (!file || !category) {
      toast({ title: "Missing fields", description: "Select file and category." });
      return;
    }

    if (!employeeId || !department || !designation) {
      toast({
        title: "Employee info missing",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const fileBase64 = await toBase64(file);

      const { error } = await supabase.from("tbldocuments").insert([
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

      if (error) throw error;

      toast({ title: "Success", description: "Document uploaded successfully." });

      setFile(null);
      setCategory("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      const { data } = await supabase
        .from("tbldocuments")
        .select("*")
        .eq("employee_id", employeeId)
        .order("id", { ascending: false });
      setUploadedDocs(data || []);
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ View document
  const handleViewDocument = (fileUrl: string) => {
    if (!fileUrl.startsWith("data:application/pdf")) {
      toast({
        title: "Invalid file",
        description: "This file cannot be opened as a PDF.",
        variant: "destructive",
      });
      return;
    }

    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe src="${fileUrl}" width="100%" height="100%" style="border:none;"></iframe>`
      );
    } else {
      toast({
        title: "Popup blocked",
        description: "Allow popups to view document.",
      });
    }
  };

  // ✅ Delete document
  const handleDeleteDocument = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this document?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("tbldocuments").delete().eq("id", id);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Document removed successfully." });
      setUploadedDocs(uploadedDocs.filter((doc) => doc.id !== id));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-10">
        {/* Upload Card */}
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
                <SelectTrigger className="w-full border-[#001F7A] text-[#001F7A]">
                  <SelectValue placeholder="Choose Document Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#001F7A] text-white">
                  <SelectItem value="education">Education Qualification</SelectItem>
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
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border-[#001F7A] text-[#001F7A]"
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-[#001F7A] hover:bg-[#001F7A]/90 text-white font-semibold py-2 rounded-lg mt-3"
            >
              {loading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>

        {/* Uploaded Documents */}
        {uploadedDocs.length > 0 && (
          <div className="w-full max-w-md mt-10 p-6 rounded-2xl shadow-md border border-gray-200 bg-white"  style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}>
            <h3 className="text-xl font-semibold text-[#001F7A] mb-4 text-center">
              Uploaded Documents
            </h3>
            <ul className="space-y-3">
              {uploadedDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-[#001F7A]  "
                   style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-[#001F7A]" size={20} />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDocument(doc.file_url)}
                      className="hover:bg-white-100 text-white-700"
                    >
                      <Eye size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="hover:bg-white-100 text-white-600"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <footer className="text-center py-4 text-gray-600 text-sm border-t border-gray-200">
        © {new Date().getFullYear()} Anthem InfoTech Pvt. Ltd. | Employee Portal
      </footer>
    </div>
  );
};

export default UploadDocument;
