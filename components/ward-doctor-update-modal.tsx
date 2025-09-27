"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

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
                <label className="block font-medium mb-1">Diagnosis</label>
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
  );
};
