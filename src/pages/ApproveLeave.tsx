import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { supabase } from "@/integrations/supabase/client";

const ApproveLeave: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch all leave requests (Approved, Rejected, Pending)
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
  .from("tblleaverequests")
  .select(`
    id,
    employee_id,
    leave_type,
    start_date,
    end_date,
    reason,
    status,
    created_at,
    tblemployees (
      first_name,
      last_name,
      department_id,
      tbldepartments ( department_name )
    )
  `)
  .order("created_at", { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (err: any) {
      console.error("Error fetching leave requests:", err);
      toast.error("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // ✅ Update leave status (Approve/Reject)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      const admin = JSON.parse(localStorage.getItem("admin") || "{}");

      const { error } = await supabase
        .from("tblleaverequests")
        .update({
          status: newStatus,
          approved_by: admin?.id || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Leave request ${newStatus.toLowerCase()} successfully.`);
      fetchLeaveRequests();
    } catch (err: any) {
      console.error("Error updating leave status:", err);
      toast.error("Failed to update leave status.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search filter (by employee name or department)
const filteredRequests = leaveRequests.filter((leave) => {
  const employeeName = `${leave.tblemployees?.first_name || ""} ${leave.tblemployees?.last_name || ""}`.toLowerCase();
  const department = leave.tblemployees?.tbldepartments?.department_name?.toLowerCase() || "";

  return (
    employeeName.includes(searchTerm.toLowerCase()) ||
    department.includes(searchTerm.toLowerCase())
  );
});

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-6xl mx-auto border shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-[#001F7A] text-2xl font-bold">
            Leave Requests Management
          </CardTitle>
          <input
            type="text"
            placeholder="Search by employee name or department"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-md px-3 py-2 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </CardHeader>

        <CardContent>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Employee</th>
                <th className="border p-2">Department</th>
                <th className="border p-2">Type</th>
                <th className="border p-2">Start</th>
                <th className="border p-2">End</th>
                <th className="border p-2">Reason</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Applied On</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center p-4 text-gray-600">
                    Loading...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4 text-gray-600">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((leave) => (
                  <tr key={leave.id}>
                    <td className="border p-2">
                      {leave.tblemployees?.first_name} {leave.tblemployees?.last_name}
                    </td>
                     <td className="border p-2">
              {leave.tblemployees?.tbldepartments?.department_name || "—"}
            </td>

                    <td className="border p-2">{leave.leave_type}</td>
                    <td className="border p-2">{leave.start_date}</td>
                    <td className="border p-2">{leave.end_date}</td>
                    <td className="border p-2">{leave.reason}</td>
                    <td
                      className={`border p-2 font-semibold ${
                        leave.status === "Approved"
                          ? "text-green-600"
                          : leave.status === "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {leave.status}
                    </td>
                    <td className="border p-2">
                      {new Date(leave.created_at).toLocaleDateString()}
                    </td>
                    <td className="border p-2 text-center">
                      {leave.status === "Pending" ? (
                        <div className="flex gap-2 justify-center">
                          <Button
                            className="bg-blue-900 hover:bg-blue-900 text-white px-4 py-2 text-sm rounded-md"
                            onClick={() => handleUpdateStatus(leave.id, "Approved")}
                            disabled={loading}
                          >
                            Approve
                          </Button>
                          <Button
                            className="bg-blue-900 hover:bg-blue-900 text-white px-4 py-2 text-sm rounded-md"
                            onClick={() => handleUpdateStatus(leave.id, "Rejected")}
                            disabled={loading}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApproveLeave;
