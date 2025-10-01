"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, X, Brain, Sparkles, Send, Loader, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface TreatmentPlan {
  plan: string;
}

interface SelectedSupply {
  supply_id: string;
  supply_name: string;
  quantity: number;
  available_stock: number;
  unit: string;
}

interface WardSupply {
  id: string;
  supply_name: string;
  supply_category: string;
  current_stock: number;
  unit: string;
  ward_id: string;
}

interface WardDoctorUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  patientId: string;
  admissionId: string;
  doctorId: string;
  patientData?: {
    patientName: string;
    age: number;
    gender: string;
    chiefComplaint?: string;
    opdDiagnosis?: string;
    admissionReason?: string;
    medicalHistory?: any;
  };
  patientDetails?: any; // Add this to pass full patient details
  initialData?: {
    receivingNotes?: string;
    generalExamination?: string;
    expertOpinionRequested?: boolean;
    diagnosis?: string;
    treatmentPlans?: TreatmentPlan[];
  };
}

export const WardDoctorUpdateModal: React.FC<WardDoctorUpdateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientId,
  admissionId,
  doctorId,
  patientData = {},
  patientDetails = null,
  initialData = {},
}) => {
  const [tab, setTab] = useState('update');
  const [receivingNotes, setReceivingNotes] = useState(initialData.receivingNotes || '');
  const [generalExamination, setGeneralExamination] = useState(initialData.generalExamination || '');
  const [expertOpinionRequested, setExpertOpinionRequested] = useState(initialData.expertOpinionRequested || false);
  const [diagnosis, setDiagnosis] = useState(initialData.diagnosis || '');
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>(initialData.treatmentPlans || [{ plan: '' }]);
  const [submitting, setSubmitting] = useState(false);
  // Lab order form state
  const [availableLabTests, setAvailableLabTests] = useState<any[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]); // test ids
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [priority, setPriority] = useState('routine');
  const [loadingLabTests, setLoadingLabTests] = useState(false);
  // Supplies state
  const [availableSupplies, setAvailableSupplies] = useState<WardSupply[]>([]);
  const [selectedSupplies, setSelectedSupplies] = useState<SelectedSupply[]>([]);
  const [loadingSupplies, setLoadingSupplies] = useState(false);

  // AI Ward Doctor Assistant States
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiQuery, setAiQuery] = useState({
    // Patient Basic Info
    patientInfo: '',
    age: '',
    gender: '',
    medicalHistory: '',
    allergies: '',
    // OPD Data
    opdDiagnosis: '',
    opdSymptoms: '',
    opdTreatmentPlan: '',
    opdChiefComplaint: '',
    // Current Ward Data  
    currentSymptoms: '',
    wardFindings: '',
    physicalExam: '',
    receivingNotes: '',
    vitalSigns: '',
    // Progress & Treatment
    treatmentProgress: '',
    currentDiagnosis: '',
    currentTreatmentPlans: '',
    // Clinical Context
    admissionReason: '',
    daysSinceAdmission: '',
    additionalNotes: ''
  });

  // Format medical history for AI context
  const formatMedicalHistory = (history: any) => {
    if (!history) return ''
    
    let formatted = []
    
    if (history.patient?.blood_group) {
      formatted.push(`Blood Group: ${history.patient.blood_group}`)
    }
    
    if (history.patient?.allergies) {
      formatted.push(`Allergies: ${history.patient.allergies}`)
    }
    
    if (history.totalVisits) {
      formatted.push(`Previous Visits: ${history.totalVisits}`)
    }
    
    if (history.currentMedications?.length > 0) {
      const meds = history.currentMedications.map((med: any) => `${med.medication} (${med.dosage})`).join(', ')
      formatted.push(`Current Medications: ${meds}`)
    }
    
    if (history.commonDiagnoses?.length > 0) {
      const diagnoses = history.commonDiagnoses.map((d: any) => d.diagnosis).join(', ')
      formatted.push(`Previous Diagnoses: ${diagnoses}`)
    }
    
    return formatted.join('\n')
  }

  // Initialize AI query with comprehensive patient data
  const initializeWardAIQuery = () => {
    // Safely access patientData with default values
    const safePatientData = patientData || {}
    
    // Debug: Let's see what we're actually getting
    console.log('🔍 DEBUG - Full patient data for AI:', {
      patientData,
      patientDetails,
      receivingNotes,
      generalExamination,
      diagnosis,
      treatmentPlans,
      clinicalInfo
    })
    
    // Calculate days since admission
    const admissionDate = patientDetails?.admission?.admission_date
    const daysSinceAdmission = admissionDate ? 
      Math.floor((new Date().getTime() - new Date(admissionDate).getTime()) / (1000 * 3600 * 24)) : 1
    
    // Format comprehensive patient information
    const patientInfo = `Patient: ${safePatientData.patientName || 'N/A'}, Age: ${safePatientData.age || 'N/A'}, Gender: ${safePatientData.gender || 'N/A'}`
    const medicalHistoryFormatted = formatMedicalHistory(safePatientData.medicalHistory)
    
    // Get all current vital signs if available
    const currentVitalSigns = patientDetails?.vitalSigns ? 
      `BP: ${patientDetails.vitalSigns.bloodPressure || 'N/A'}, Temp: ${patientDetails.vitalSigns.temperature || 'N/A'}°F, HR: ${patientDetails.vitalSigns.heartRate || 'N/A'} bpm, RR: ${patientDetails.vitalSigns.respiratoryRate || 'N/A'}, O2: ${patientDetails.vitalSigns.oxygenSaturation || 'N/A'}%` :
      'Vital signs not recorded'
    
    setAiQuery({
      // Patient Basic Info
      patientInfo: patientInfo,
      age: String(safePatientData.age || 'Unknown'),
      gender: safePatientData.gender || 'Unknown',
      medicalHistory: medicalHistoryFormatted || 'No medical history available',
      allergies: patientDetails?.admission?.patient?.allergies || 'No known allergies',
      
      // OPD Data (from visits table and patient data)
      opdDiagnosis: patientDetails?.visits?.diagnosis || safePatientData.opdDiagnosis || 'No OPD diagnosis available',
      opdSymptoms: patientDetails?.visits?.symptoms || 'No OPD symptoms recorded',
      opdTreatmentPlan: patientDetails?.visits?.treatment_plan || 'No OPD treatment plan available',
      opdChiefComplaint: patientDetails?.visits?.chief_complaint || safePatientData.chiefComplaint || 'No chief complaint recorded',
      
      // Current Ward Data (from current form)
      currentSymptoms: safePatientData.chiefComplaint || receivingNotes || 'No current symptoms noted',
      wardFindings: generalExamination || 'No ward findings recorded',
      physicalExam: generalExamination || 'Physical examination pending',
      receivingNotes: receivingNotes || 'No receiving notes available',
      vitalSigns: currentVitalSigns,
      
      // Progress & Treatment (current form data)
      treatmentProgress: treatmentPlans.map(tp => tp.plan).join('\n') || 'No treatment progress noted',
      currentDiagnosis: diagnosis || 'Diagnosis pending',
      currentTreatmentPlans: treatmentPlans.map((tp, i) => `${i + 1}. ${tp.plan}`).join('\n') || 'No current treatment plans',
      
      // Clinical Context
      admissionReason: safePatientData.admissionReason || patientDetails?.admission?.admission_reason || 'Admission reason not specified',
      daysSinceAdmission: String(daysSinceAdmission),
      additionalNotes: clinicalInfo || 'No additional clinical notes'
    })
    
    setAiResponse('')
    setShowAIDialog(true)
    console.log('🤖 AI Query prepared with comprehensive patient data')
  }

  // Send comprehensive ward data to AI for analysis
  const askWardAIForDiagnosis = async () => {
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/ward-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Patient Basic Information
          patientInfo: aiQuery.patientInfo,
          age: aiQuery.age,
          gender: aiQuery.gender,
          medicalHistory: aiQuery.medicalHistory,
          allergies: aiQuery.allergies,
          
          // OPD Consultation Data
          opdDiagnosis: aiQuery.opdDiagnosis,
          opdSymptoms: aiQuery.opdSymptoms,
          opdTreatmentPlan: aiQuery.opdTreatmentPlan,
          opdChiefComplaint: aiQuery.opdChiefComplaint,
          
          // Current Ward Assessment
          currentSymptoms: aiQuery.currentSymptoms,
          wardFindings: aiQuery.wardFindings,
          physicalExam: aiQuery.physicalExam,
          receivingNotes: aiQuery.receivingNotes,
          vitalSigns: aiQuery.vitalSigns,
          
          // Treatment Progress & Current Status
          treatmentProgress: aiQuery.treatmentProgress,
          currentDiagnosis: aiQuery.currentDiagnosis,
          currentTreatmentPlans: aiQuery.currentTreatmentPlans,
          
          // Clinical Context
          admissionReason: aiQuery.admissionReason,
          daysSinceAdmission: aiQuery.daysSinceAdmission,
          additionalNotes: aiQuery.additionalNotes,
          
          context: 'comprehensive_ward_analysis'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setAiResponse(result.diagnosis)
      } else {
        setAiResponse(`Error: ${result.error || 'Failed to get AI diagnosis assistance'}`)
      }
    } catch (error) {
      console.error('Ward AI consultation error:', error)
      setAiResponse('Sorry, I encountered an error while processing your request. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // Use AI suggestion in diagnosis field
  const useWardAISuggestion = () => {
    if (aiResponse) {
      setDiagnosis(prev => prev ? `${prev}\n\n--- AI Ward Analysis ---\n${aiResponse}` : aiResponse)
      setShowAIDialog(false)
    }
  }

  const handleTreatmentPlanChange = (idx: number, value: string) => {
    setTreatmentPlans((prev) => prev.map((tp, i) => (i === idx ? { plan: value } : tp)));
  };

  const addTreatmentPlan = () => {
    setTreatmentPlans((prev) => [...prev, { plan: '' }]);
  };

  const removeTreatmentPlan = (idx: number) => {
    setTreatmentPlans((prev) => prev.filter((_, i) => i !== idx));
  };

  // Fetch available lab tests
  const fetchLabTests = async () => {
    setLoadingLabTests(true);
    try {
      const res = await fetch('/api/lab-tests');
      const result = await res.json();
      if (result.success) {
        setAvailableLabTests(result.data);
      } else {
        console.error('Failed to fetch lab tests:', result.error);
      }
    } catch (e) {
      console.error('Error fetching lab tests:', e);
    } finally {
      setLoadingLabTests(false);
    }
  };

  useEffect(() => {
    fetchLabTests();
  }, []);

  const addLabTest = (testId: string) => {
    if (!selectedLabTests.includes(testId)) {
      setSelectedLabTests(prev => [...prev, testId]);
    }
  };

  const removeLabTest = (testId: string) => {
    setSelectedLabTests(prev => prev.filter(id => id !== testId));
  };

  // Fetch available supplies from ward
  const fetchSupplies = async () => {
    setLoadingSupplies(true);
    try {
      const res = await fetch(`/api/ward-supplies?ward_id=${encodeURIComponent('current_ward')}`);
      const result = await res.json();
      if (result.success) {
        setAvailableSupplies(result.data);
      } else {
        console.error('Failed to fetch supplies:', result.error);
      }
    } catch (e) {
      console.error('Error fetching supplies:', e);
    } finally {
      setLoadingSupplies(false);
    }
  };

  useEffect(() => {
    fetchLabTests();
    fetchSupplies();
  }, []);

  const addSupply = (supplyId: string) => {
    const supply = availableSupplies.find(s => s.id === supplyId);
    if (supply && !selectedSupplies.find(s => s.supply_id === supplyId)) {
      setSelectedSupplies(prev => [...prev, {
        supply_id: supply.id,
        supply_name: supply.supply_name,
        quantity: 1,
        available_stock: supply.current_stock,
        unit: supply.unit
      }]);
    }
  };

  const removeSupply = (supplyId: string) => {
    setSelectedSupplies(prev => prev.filter(s => s.supply_id !== supplyId));
  };

  const updateSupplyQuantity = (supplyId: string, quantity: number) => {
    setSelectedSupplies(prev => prev.map(s => 
      s.supply_id === supplyId ? { ...s, quantity: Math.max(1, Math.min(quantity, s.available_stock)) } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    onSubmit({
      receivingNotes,
      generalExamination,
      expertOpinionRequested,
      diagnosis,
      treatmentPlans: treatmentPlans.filter(tp => tp.plan.trim() !== ''),
      selectedSupplies: selectedSupplies.filter(s => s.quantity > 0),
    });
    setSubmitting(false);
    onClose();
  };

  const handleLabOrderSubmit = async () => {
    if (selectedLabTests.length === 0) {
      alert('Please select at least one lab test');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        patient_id: patientId,
        doctor_id: doctorId,
        test_ids: selectedLabTests,
        clinical_info: clinicalInfo,
        priority: priority,
        notes: `Lab order from ward doctor for admission ${admissionId}`,
        admission_id: admissionId // Include admission_id for ward doctor orders
      };

      const response = await fetch('/api/lab-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create lab order';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      alert(`Lab order submitted successfully! Order #${result.data.orderNumber}`);
      
      // Reset form
      setSelectedLabTests([]);
      setClinicalInfo('');
      setPriority('routine');
      onClose();
    } catch (error) {
      console.error('Error submitting lab order:', error);
      alert('Failed to submit lab order: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-2 border-b sticky top-0 bg-white z-10">
          <DialogTitle className="text-2xl font-bold text-gray-900">Patient Actions</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex w-full border-b bg-transparent">
            <TabsTrigger value="update" className="flex-1">Update Info</TabsTrigger>
            <TabsTrigger value="lab" className="flex-1">Order Lab Tests</TabsTrigger>
          </TabsList>
          <TabsContent value="update">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block font-medium mb-1">Receiving Notes</label>
                <Textarea
                  value={receivingNotes}
                  onChange={e => setReceivingNotes(e.target.value)}
                  placeholder="Enter receiving notes..."
                  className="resize-none min-h-[60px]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">General Examination</label>
                <Textarea
                  value={generalExamination}
                  onChange={e => setGeneralExamination(e.target.value)}
                  placeholder="Enter examination findings..."
                  className="resize-none min-h-[60px]"
                />
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  checked={expertOpinionRequested}
                  onCheckedChange={setExpertOpinionRequested}
                />
                <label className="font-medium">Expert Opinion Requested</label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium">Diagnosis</label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={initializeWardAIQuery}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Ask AI
                  </Button>
                </div>
                <Textarea
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis..."
                  className="resize-none min-h-[60px]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-medium">Treatment Plans</label>
                  <Button type="button" size="sm" onClick={addTreatmentPlan} className="text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Plan
                  </Button>
                </div>
                {treatmentPlans.map((tp, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <Textarea
                      value={tp.plan}
                      onChange={e => handleTreatmentPlanChange(idx, e.target.value)}
                      placeholder={`Treatment plan ${idx + 1}...`}
                      className="flex-1 resize-none min-h-[50px]"
                    />
                    {treatmentPlans.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeTreatmentPlan(idx)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Supplies Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-medium">Required Supplies</label>
                  <Select onValueChange={addSupply}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add supply..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingSupplies ? (
                        <SelectItem value="loading" disabled>Loading supplies...</SelectItem>
                      ) : (
                        availableSupplies
                          .filter(supply => !selectedSupplies.find(s => s.supply_id === supply.id))
                          .map((supply) => (
                            <SelectItem key={supply.id} value={supply.id}>
                              {supply.supply_name} ({supply.current_stock} {supply.unit} available)
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedSupplies.length > 0 && (
                  <div className="space-y-2">
                    {selectedSupplies.map((supply) => (
                      <div key={supply.supply_id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <span className="font-medium">{supply.supply_name}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({supply.available_stock} {supply.unit} available)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            max={supply.available_stock}
                            value={supply.quantity}
                            onChange={(e) => updateSupplyQuantity(supply.supply_id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">{supply.unit}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeSupply(supply.supply_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Updates'}
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="lab">
            <div className="p-6 space-y-5">
              <div>
                <label className="block font-medium mb-2">Available Lab Tests</label>
                {loadingLabTests ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading lab tests...</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {availableLabTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{test.test_name}</p>
                          <p className="text-xs text-gray-500">{test.category} • ${test.cost}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedLabTests.includes(test.id) ? "default" : "outline"}
                          onClick={() => selectedLabTests.includes(test.id) ? removeLabTest(test.id) : addLabTest(test.id)}
                          className="ml-2"
                        >
                          {selectedLabTests.includes(test.id) ? 'Remove' : 'Add'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedLabTests.length > 0 && (
                <div>
                  <label className="block font-medium mb-2">Selected Tests ({selectedLabTests.length})</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-3">
                    {selectedLabTests.map((testId) => {
                      const test = availableLabTests.find(t => t.id === testId);
                      return test ? (
                        <div key={testId} className="flex items-center justify-between text-sm">
                          <span>{test.test_name}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeLabTest(testId)}
                            className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">Clinical Information</label>
                <Textarea
                  value={clinicalInfo}
                  onChange={e => setClinicalInfo(e.target.value)}
                  placeholder="Enter clinical information for lab tests..."
                  className="resize-none min-h-[60px]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleLabOrderSubmit}
                  disabled={submitting || selectedLabTests.length === 0}
                >
                  {submitting ? 'Submitting...' : 'Submit Lab Order'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* AI Ward Doctor Assistant Dialog */}
    {showAIDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Ward AI Assistant</h2>
                  <p className="text-sm text-gray-600">Compare OPD diagnosis with current ward findings</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShowAIDialog(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-lg">Patient Information & Progress</h3>
                </div>

                <div>
                  <Label htmlFor="ward-patient-info">Patient Info</Label>
                  <Textarea
                    id="ward-patient-info"
                    value={aiQuery.patientInfo}
                    onChange={(e) => setAiQuery(prev => ({ ...prev, patientInfo: e.target.value }))}
                    placeholder="Patient details and medical history..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="ward-opd-diagnosis">Original OPD Diagnosis</Label>
                  <Textarea
                    id="ward-opd-diagnosis"
                    value={aiQuery.opdDiagnosis}
                    onChange={(e) => setAiQuery(prev => ({ ...prev, opdDiagnosis: e.target.value }))}
                    placeholder="Original diagnosis from OPD doctor..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="ward-opd-symptoms">OPD Symptoms & Chief Complaint</Label>
                  <Textarea
                    id="ward-opd-symptoms"
                    value={`Chief Complaint: ${aiQuery.opdChiefComplaint}\nSymptoms: ${aiQuery.opdSymptoms}`}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      const chiefComplaint = lines.find(line => line.startsWith('Chief Complaint:'))?.substring(17) || '';
                      const symptoms = lines.find(line => line.startsWith('Symptoms:'))?.substring(9) || '';
                      setAiQuery(prev => ({ 
                        ...prev, 
                        opdChiefComplaint: chiefComplaint.trim(),
                        opdSymptoms: symptoms.trim()
                      }));
                    }}
                    placeholder="Chief Complaint: Original patient complaint from OPD&#10;Symptoms: Initial symptoms documented by OPD"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="ward-vital-signs">Current Vital Signs</Label>
                  <Textarea
                    id="ward-vital-signs"
                    value={aiQuery.vitalSigns}
                    onChange={(e) => setAiQuery(prev => ({ ...prev, vitalSigns: e.target.value }))}
                    placeholder="BP, Temperature, Heart Rate, Respiratory Rate, O2 Saturation..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="ward-current-symptoms">Current Symptoms/Complaints</Label>
                  <Textarea
                    id="ward-current-symptoms"
                    value={aiQuery.currentSymptoms}
                    onChange={(e) => setAiQuery(prev => ({ ...prev, currentSymptoms: e.target.value }))}
                    placeholder="Current patient symptoms and complaints..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="ward-findings">Ward Examination Findings</Label>
                  <Textarea
                    id="ward-findings"
                    value={aiQuery.wardFindings}
                    onChange={(e) => setAiQuery(prev => ({ ...prev, wardFindings: e.target.value }))}
                    placeholder="Current examination findings in the ward..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="ward-treatment-progress">Treatment Progress</Label>
                  <Textarea
                    id="ward-treatment-progress"
                    value={aiQuery.treatmentProgress}
                    onChange={(e) => setAiQuery(prev => ({ ...prev, treatmentProgress: e.target.value }))}
                    placeholder="Response to current treatment, progress notes..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="ward-additional-notes">Additional Notes</Label>
                  <Textarea
                    id="ward-additional-notes"
                    value={aiQuery.additionalNotes}
                    onChange={(e) => setAiQuery(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    placeholder="Admission reason, other relevant information..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={askWardAIForDiagnosis}
                  disabled={aiLoading || !aiQuery.opdDiagnosis.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  {aiLoading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Ward vs OPD...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Get Ward AI Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* AI Response Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-lg">Ward AI Analysis</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 min-h-[500px]">
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                      <p className="text-gray-600">AI is comparing OPD vs Ward findings...</p>
                      <p className="text-sm text-gray-500 mt-2">Analyzing treatment progression and recommendations</p>
                    </div>
                  ) : aiResponse ? (
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                          {aiResponse}
                        </pre>
                      </div>
                      
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={useWardAISuggestion}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Use This Analysis
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setAiResponse('')}
                        >
                          Clear Response
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                      <Brain className="h-12 w-12 mb-4 text-gray-300" />
                      <p>Ward AI analysis will appear here</p>
                      <p className="text-sm mt-2">AI will compare OPD diagnosis with current ward findings and provide comprehensive insights</p>
                    </div>
                  )}
                </div>

                {aiResponse && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div className="text-xs text-amber-700">
                        <p className="font-medium">⚠️ Medical Disclaimer</p>
                        <p>AI analysis is for educational support. Always use clinical judgment and consider all relevant factors in patient care decisions.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
