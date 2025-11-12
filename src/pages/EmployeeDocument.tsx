// src/pages/admin/EmployeeDocument.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Upload, Trash2, ArrowLeft } from "lucide-react";

interface Document {
  id: number;
  employee_id: number;
  category: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

const EmployeeDocument = () => {
  const { id } = useParams(); // /admin/employee-documents/:id
  const employeeId = Number(id);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeId) fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("tbldocuments")
        .select("*")
        .eq("employee_id", employeeId);

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Unable to fetch employee documents.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file || !category) {
      toast({
        title: "Missing fields",
        description: "Please select both a file and category.",
      });
      return;
    }

    try {
      setLoading(true);
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

      const fileBase64 = await toBase64(file);

      const { error: dbError } = await supabase.from("tbldocuments").insert([
        {
          employee_id: employeeId,
          category,
          file_name: file.name,
          file_url: fileBase64,
          uploaded_by: "Admin",
          department: "General",
          designation: "Admin Upload",
        },
      ]);

      if (dbError) throw dbError;

      toast({
        title: "Upload successful",
        description: "Document uploaded successfully.",
      });

      setFile(null);
      setCategory("");
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: Document) => {
    const url = doc.file_url;
    if (!url) {
      toast({
        title: "Error",
        description: "No file URL found.",
        variant: "destructive",
      });
      return;
    }

    if (url.startsWith("data:")) {
      const byteString = atob(url.split(",")[1]);
      const mimeString = url.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);

      const blob = new Blob([ab], { type: mimeString });
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const { error } = await supabase.from("tbldocuments").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Deleted",
        description: "Document removed successfully.",
      });
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow px-6 py-8 mt-20">
        <Card className="w-full max-w-5xl mx-auto rounded-xl shadow-lg border border-gray-200"
          style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
        >
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-[#001F7A]">
                Employee Documents
              </CardTitle>
              
            </div>

            {/* ✅ Back to Dashboard Button */}
            <Button
              onClick={() => navigate("/employees")}
              className="bg-[#001F7A] text-white hover:bg-[#0029b0] flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </CardHeader>

          <CardContent>
            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div>
                <Select onValueChange={(val) => setCategory(val)} value={category || undefined}>
                  <SelectTrigger className="w-full border-blue-900 text-white-900 font-medium bg-blue-900 focus:outline-none focus:ring-0 shadow-none">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#001F7A] text-white border-none shadow-lg">
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="skills">Skill Set</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  type="file"
                  accept="application/pdf"
                  
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={loading}
                className="bg-[#001F7A] text-white hover:bg-[#0029b0]"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {/* Documents Table */}
            <div className="border rounded-lg overflow-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-blue-50">
                  <TableRow>
                    <TableHead className="font-bold">File Name</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold text-center">Uploaded By</TableHead>
                    <TableHead className="font-bold text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-gray-100">
                      <TableCell>{doc.file_name}</TableCell>
                      <TableCell>{doc.category}</TableCell>
                      <TableCell className="text-center">{doc.uploaded_by}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-blue-900 text-white hover:bg-blue-700 h-7 w-7 p-0"
                            title="Download"
                            onClick={() => handleDownload(doc)}
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-700 text-white hover:bg-red-600 h-7 w-7 p-0"
                            title="Delete"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-3 text-muted-foreground">
                        No documents found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmployeeDocument;
