import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertCircle, Bed, UserCheck, Stethoscope, ClipboardList, RefreshCw, Activity, Calendar, Clock, Users, Plus, Search, Filter, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { PatientInfoModal } from '@/components/patient-info-modal';
import { WardDoctorUpdateModal } from '@/components/ward-doctor-update-modal';
import { useRouter } from 'next/navigation';

// Types for ward doctor dashboard
interface WardPatient {
  admissionId: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  bedNumber: string;
  wardName: string;
  diagnosis: string;
  treatmentPlan: string;
  admissionStatus: string;
  notes?: string;
  vitals?: Record<string, string | number>;
}

export default function WardDoctorDashboard() {

  const [patients, setPatients] = useState<WardPatient[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatePatient, setUpdatePatient] = useState<WardPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [showPatientInfoModal, setShowPatientInfoModal] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<any>(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  // Fetch patient details by admission ID for the modal
  // Fetch patient details by bed ID for the modal (to get full doctor info)
  const fetchPatientDetailsByAdmission = async (admissionId: string) => {
    try {
      setLoadingPatientDetails(true);
      setShowPatientInfoModal(true);
      // Find the bedId for this admissionId from the patients list
      const patient = patients.find((p) => p.admissionId === admissionId);
      const bedId = patient?.bedNumber;
      if (!bedId) {
        setSelectedPatientDetails(null);
        setLoadingPatientDetails(false);
        return;
      }
      const response = await fetch(`/api/ward-admin/patient-details?bed_id=${encodeURIComponent(bedId)}`);
      if (!response.ok) throw new Error('Failed to fetch patient details');
      const data = await response.json();
      if (data.success) {
        setSelectedPatientDetails(data.data);
      } else {
        setSelectedPatientDetails(null);
      }
    } catch (error) {
      setSelectedPatientDetails(null);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  // Helper to get doctor id from localStorage (matches other dashboards)
  function getDoctorIdFromLocalStorage() {
    if (typeof window === 'undefined') return null;
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.warn('No user found in localStorage');
        return null;
      }
      const user = JSON.parse(userData);
      console.log('Doctor user object from localStorage:', user);
      return user.id || user.userId || user.username || null;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      return null;
    }
  }

  // Fetch patients assigned to this ward doctor using localStorage auth (like other dashboards)
  const fetchWardPatients = async () => {
    setRefreshing(true);
    try {
      const doctorId = getDoctorIdFromLocalStorage();
      if (!doctorId) {
        setPatients([]);
        setLoading(false);
        setRefreshing(false);
        console.warn('No doctorId found from localStorage, cannot fetch assigned patients.');
        return;
      }
      console.log('Fetching assigned patients for doctorId (localStorage):', doctorId);
      const response = await fetch(`/api/admissions/assigned?doctor_id=${doctorId}`);
      const result = await response.json();
      console.log('API /api/admissions/assigned result:', result);
      if (result.success && result.data && result.data.byDoctor && result.data.byDoctor[doctorId]) {
        // Map API response to WardPatient[]
        const mapped = result.data.byDoctor[doctorId].map((a: any) => ({
          admissionId: a.admissionId, // Use the correct field from API response
          patientId: a.patientId,
          patientName: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : 'Unknown',
          age: a.patient ? a.patient.age : '',
          gender: a.patient ? a.patient.gender : '',
          bedNumber: a.bedId || '',
          wardName: a.wardId || '',
          diagnosis: a.admissionReason || '', // Now this field is available
          treatmentPlan: '',
          admissionStatus: a.admissionStatus || '',
        }));
        setPatients(mapped);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching assigned patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWardPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || p.bedNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.admissionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg flex-shrink-0">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Ward Doctor Dashboard</h1>
              <p className="text-sm text-gray-500 hidden sm:block">Manage your assigned ward patients, beds, and clinical tasks</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button variant="outline" onClick={fetchWardPatients} disabled={refreshing} size="sm">
              <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" onClick={async () => { await signOut(); router.push('/login'); }} size="sm">
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Total Patients</p>
                  <p className="text-xl font-bold text-gray-900">{filteredPatients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl flex-shrink-0">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Active Cases</p>
                  <p className="text-xl font-bold text-gray-900">{filteredPatients.filter(p => p.admissionStatus === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-xl flex-shrink-0">
                  <Bed className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Occupied Beds</p>
                  <p className="text-xl font-bold text-gray-900">{filteredPatients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-xl flex-shrink-0">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Patient List Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Patient List</CardTitle>
              {/* Button removed as only ward admin can assign patients */}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm" 
                  placeholder="Search by name or bed..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 border-gray-200 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-3 text-sm text-gray-500">Loading ward patients...</p>
                </div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Ward</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Diagnosis</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((p, index) => (
                      <tr key={p.admissionId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserCheck className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{p.patientName}</div>
                              <div className="text-xs text-gray-500">{p.age}y • {p.gender}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          <Badge variant="secondary" className="inline-flex items-center text-xs">
                            <Bed className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[60px]">{p.bedNumber}</span>
                          </Badge>
                        </td>
                        <td className="px-2 py-4 text-sm text-gray-900 hidden md:table-cell">
                          <span className="truncate max-w-[80px] block">{p.wardName}</span>
                        </td>
                        <td className="px-2 py-4 text-sm text-gray-900 hidden lg:table-cell">
                          <span className="truncate max-w-[100px] block">{p.diagnosis}</span>
                        </td>
                        <td className="px-2 py-4">
                          <Badge className={`text-xs ${
                            p.admissionStatus === 'active' ? 'bg-green-100 text-green-800' : ''
                          }${
                            p.admissionStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''
                          }${
                            p.admissionStatus === 'discharged' ? 'bg-gray-100 text-gray-800' : ''
                          }`}>
                            {p.admissionStatus}
                          </Badge>
                        </td>
                        <td className="px-2 py-4 text-sm font-medium">
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
                              onClick={() => fetchPatientDetailsByAdmission(p.admissionId)}>
                              View
                            </Button>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1"
                              onClick={() => {
                                setUpdatePatient(p);
                                setShowUpdateModal(true);
                              }}>
                              Update
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Quick Actions & Management Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
              <TabsTrigger value="tasks" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <ClipboardList className="h-4 w-4" />
                <span>Clinical Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="vitals" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Activity className="h-4 w-4" />
                <span>Patient Vitals</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Calendar className="h-4 w-4" />
                <span>Notes</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-white border-0 shadow-sm">
                  <CardHeader className="border-b border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">Today's Tasks</CardTitle>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-yellow-800">Morning Rounds - Ward A</p>
                          <p className="text-xs text-yellow-600">Due in 30 minutes</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-600">
                          Complete
                        </Button>
                      </div>
                      <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-blue-800">Patient Vitals Review</p>
                          <p className="text-xs text-blue-600">3 patients pending</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader className="border-b border-gray-100 p-6">
                    <CardTitle className="text-lg font-semibold text-gray-900">Task Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="font-semibold text-green-600">8</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending</span>
                        <span className="font-semibold text-yellow-600">4</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Overdue</span>
                        <span className="font-semibold text-red-600">0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="vitals" className="mt-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100 p-6">
                  <CardTitle className="text-lg font-semibold text-gray-900">Patient Vitals Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Vitals Monitoring</h3>
                    <p className="text-gray-600">Track and monitor vital signs for all your ward patients</p>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                      <Activity className="h-4 w-4 mr-2" />
                      View All Vitals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes" className="mt-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100 p-6">
                  <CardTitle className="text-lg font-semibold text-gray-900">Clinical Notes</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Notes</h3>
                    <p className="text-gray-600">Add and review clinical notes for patient care documentation</p>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <PatientInfoModal
        isOpen={showPatientInfoModal}
        onClose={() => {
          setShowPatientInfoModal(false);
          setSelectedPatientDetails(null);
        }}
        patientDetails={selectedPatientDetails}
        loading={loadingPatientDetails}
      />
      <WardDoctorUpdateModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setUpdatePatient(null);
        }}
        patientId={updatePatient?.patientId || ''}
        admissionId={updatePatient?.admissionId || ''}
        doctorId={getDoctorIdFromLocalStorage() || ''}
        onSubmit={async (data) => {
          if (!updatePatient || !updatePatient.admissionId) {
            alert('Error: No valid admission ID for this patient.');
            return;
          }
          try {
            const payload = {
              admission_id: updatePatient.admissionId,
              doctor_id: getDoctorIdFromLocalStorage(),
              receiving_notes: data.receivingNotes,
              general_examination: data.generalExamination,
              expert_opinion_requested: !!data.expertOpinionRequested,
              diagnosis: data.diagnosis,
              treatment_plan: data.treatmentPlans.map((tp: any) => tp.plan).join('\n'),
              selectedSupplies: data.selectedSupplies || []
            };
            console.log('Submitting ward doctor update payload:', payload);
            const res = await fetch('/api/ward-doctor-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              const err = await res.json();
              alert('Failed to update: ' + (err.error || 'Unknown error'));
            } else {
              // Optionally refresh patient list or show success
              await fetchWardPatients();
              alert('Update saved successfully!');
            }
          } catch (e: any) {
            alert('Error: ' + (e.message || e));
          }
        }}
        initialData={{}}
      />
    </div>
  );
}
