"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface HistoryData {
  patient?: any;
  visits?: any[];
  totalVisits?: number;
}

export default function PatientHistoryPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/patients/history?patient_id=${id}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError('No history found');
        }
      } catch (e:any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/receptionist" className="inline-flex items-center text-sm text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
          <h1 className="text-xl font-bold">Patient Visit History</h1>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Loading...</div>}
        {error && <div className="p-4 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
        {data && (
          <div className="space-y-6">
            <div className="bg-white border rounded p-4 grid md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500 text-xs">Name</p><p className="font-semibold">{data.patient?.first_name} {data.patient?.last_name}</p></div>
              <div><p className="text-gray-500 text-xs">Patient #</p><p>{data.patient?.patient_number || '—'}</p></div>
              <div><p className="text-gray-500 text-xs">Phone</p><p>{data.patient?.phone || '—'}</p></div>
              <div><p className="text-gray-500 text-xs">Total Visits</p><p className="font-bold">{data.totalVisits}</p></div>
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-3">Visits</h2>
              {data.visits && data.visits.length > 0 ? (
                <div className="space-y-4">
                  {data.visits.map((v:any, idx:number) => (
                    <div key={v.id || idx} className="bg-white border rounded p-4 text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Visit #{data.totalVisits - idx}</span>
                        <span className="text-xs text-gray-500">{v.visit_date ? new Date(v.visit_date).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div><span className="font-semibold">Symptoms: </span>{v.symptoms || v.chief_complaint || '—'}</div>
                        <div><span className="font-semibold">Diagnosis: </span>{v.diagnosis || v.final_diagnosis || '—'}</div>
                        <div><span className="font-semibold">Treatment: </span>{v.treatment_plan || v.notes || '—'}</div>
                        <div><span className="font-semibold">Priority: </span>{v.priority || 'Normal'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic">No visits.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
