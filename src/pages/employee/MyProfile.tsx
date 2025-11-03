import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { supabase } from "@/integrations/supabase/client";

const MyProfile: React.FC = () => {
  const [employee, setEmployee] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmployee = JSON.parse(localStorage.getItem("employee") || "{}");

    if (!storedEmployee?.employee_id) {
      toast.error("No employee data found. Please log in again.");
      return;
    }

    const fetchEmployeeDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("tblemployees")
          .select(`
            employee_id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            address,
            file_data,
            status,
            employee_code,
            tbldepartments(department_name),
            tbldesignations(designation_title),
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relation
          `)
          .eq("employee_id", storedEmployee.employee_id)
          .single();

        if (error) throw error;

        setEmployee(data);
        setFormData(data);
      } catch (err: any) {
        console.error("Error fetching employee data:", err.message || err);
        toast.error("Failed to load profile");
      }
    };

    fetchEmployeeDetails();
  }, []);

  // Convert image to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, file_data: reader.result });
      toast.info("Profile photo updated (not saved yet)");
    };
    reader.readAsDataURL(file);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save changes
  const handleSave = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("tblemployees")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          file_data: formData.file_data, // ✅ saves Base64 image
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relation: formData.emergency_contact_relation,
        })
        .eq("employee_id", employee.employee_id);

      if (error) throw error;

      setEmployee(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!employee)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-3 flex justify-center">
      <Card className="w-full max-w-2xl bg-white shadow-md border rounded-xl p-6"
      style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}
      >
        {/* Header */}
        <CardHeader className="flex flex-col items-center border-b pb-4 mb-4">
          <div className="relative">
            <img
              src={
                formData.file_data ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt="Profile"
              className="w-24 h-24 rounded-full border-2 border-[#001F7A] object-cover"
            />
            {isEditing && (
              <div className="absolute bottom-0 right-0">
                <label className="cursor-pointer bg-[#001F7A] text-white text-xs px-2 py-1 rounded-md">
                  Edit
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}
          </div>

          <CardTitle className="text-[#001F7A] text-lg font-bold mt-3">
            {`${employee.first_name || ""} ${employee.last_name || ""}`}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {employee.tbldesignations?.designation_title || "Not Assigned"}{" "}
            <span className="text-gray-400">|</span>{" "}
            {employee.tbldepartments?.department_name || "No Department"}
          </p>

          {!isEditing ? (
            <Button
              className="mt-3 bg-[#001F7A] hover:bg-blue-900 text-white text-xs px-4 py-2"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2 mt-3">
              <Button
                className="bg-blue-900 hover:bg-blue-900 text-white text-xs px-4 py-2"
                onClick={handleSave}
                disabled={loading}
              >
                Save
              </Button>
              <Button
                className="bg-blue-900 hover:bg-blue-900 text-white text-xs px-4 py-2"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>

        {/* Form Section */}
        <CardContent className="space-y-5">
          <div>
            <h2 className="text-md font-semibold text-[#001F7A] mb-2">
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">First Name</Label>
                {isEditing ? (
                  <Input
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">{employee.first_name}</p>
                )}
              </div>
              <div>
                <Label className="text-sm">Last Name</Label>
                {isEditing ? (
                  <Input
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">{employee.last_name}</p>
                )}
              </div>
              <div>
                <Label className="text-sm">Email</Label>
                {isEditing ? (
                  <Input
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">{employee.email}</p>
                )}
              </div>
              <div>
                <Label className="text-sm">Phone</Label>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">{employee.phone}</p>
                )}
              </div>
              <div>
                <Label className="text-sm">Date of Birth</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">
                    {employee.date_of_birth || "N/A"}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm">Address</Label>
                {isEditing ? (
                  <Input
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">
                    {employee.address || "No address added"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h2 className="text-md font-semibold text-[#001F7A] mb-2">
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">Name</Label>
                {isEditing ? (
                  <Input
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">
                    {employee.emergency_contact_name || "N/A"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm">Phone</Label>
                {isEditing ? (
                  <Input
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">
                    {employee.emergency_contact_phone || "N/A"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm">Relation</Label>
                {isEditing ? (
                  <Input
                    name="emergency_contact_relation"
                    value={formData.emergency_contact_relation || ""}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">
                    {employee.emergency_contact_relation || "N/A"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProfile;
