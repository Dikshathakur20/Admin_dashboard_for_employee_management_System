import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const TrackAttendance = () => {
  const { id } = useParams(); // employee_id from URL
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) fetchAttendance(id);
  }, [id]);

  const fetchAttendance = async (employeeId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tblattendance")
        .select("date, check_in, check_out, total_hours, status")
        .eq("employee_id", employeeId)
        .order("date", { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      console.error("Error fetching attendance:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">
        Track Attendance (Employee ID: {id})
      </h2>

      {loading ? (
        <p className="text-gray-500">Loading attendance...</p>
      ) : records.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300 text-center bg-white shadow">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Check-In</th>
              <th className="border p-2">Check-Out</th>
         
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="border p-2">{rec.date}</td>
                <td className="border p-2">
                  {rec.check_in
                    ? new Date(rec.check_in).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>
                <td className="border p-2">
                  {rec.check_out
                    ? new Date(rec.check_out).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>
                
                <td className="border p-2">{rec.status || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No attendance records found.</p>
      )}

      <Button
        onClick={() => window.history.back()}
        className="mt-4 bg-blue-900 text-white hover:bg-blue-800"
      >
        Back
      </Button>
    </div>
  );
};

export default TrackAttendance;
