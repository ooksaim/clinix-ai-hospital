"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Eye, 
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  LogOut,
  ArrowUpRight
} from 'lucide-react';

interface SupplyRequest {
  id: string;
  ward_name: string;
  supply_name: string;
  quantity_requested: number;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  request_reason: string;
  request_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  requested_by_name: string;
  pharmacy_supply_id: string;
  pharmacy_stock: number;
  unit: string;
  availability_status: string;
}

interface PharmacyStock {
  id: string;
  supply_name: string;
  supply_category: string;
  current_stock: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  unit: string;
  cost_per_unit: number;
  supplier: string;
  last_restocked_date: string;
  expiry_date: string;
  batch_number: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PharmacyTransaction {
  id: string;
  transaction_type: string;
  pharmacy_supply_id: string;
  ward_supply_id: string;
  supply_request_id: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  performed_by: string;
  ward_id: string;
  notes: string;
  created_at: string;
  supply_name?: string;
  ward_name?: string;
  pharmacist_name?: string;
}

export const PharmacistDashboard: React.FC = () => {
  // Authentication - same pattern as doctor dashboard
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  // State for different data types
  const [pendingRequests, setPendingRequests] = useState<SupplyRequest[]>([]);
  const [pharmacyStock, setPharmacyStock] = useState<PharmacyStock[]>([]);
  const [lowStockItems, setLowStockItems] = useState<PharmacyStock[]>([]);
  const [transactions, setTransactions] = useState<PharmacyTransaction[]>([]);
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<PharmacyStock | null>(null);

  // Form states
  const [approvalNotes, setApprovalNotes] = useState('');
  const [stockForm, setStockForm] = useState({
    supply_name: '',
    supply_category: '',
    current_stock: 0,
    minimum_stock_level: 0,
    maximum_stock_level: 0,
    unit: '',
    cost_per_unit: 0,
    supplier: '',
    batch_number: '',
    expiry_date: '',
    notes: ''
  });

  // Authentication check - same as doctor dashboard
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== 'pharmacist') {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      localStorage.removeItem('user');
      router.push('/login');
      return;
    }
    
    setLoadingAuth(false);
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      loadPendingRequests();
      loadPharmacyStock();
      loadLowStockItems();
      loadTransactions();
    }
  }, [currentUser]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacist/pending-requests');
      if (response.ok) {
        const data = await response.json();
        console.log('Pending requests data:', data);
        // Handle both direct array and nested object responses
        const requests = data.requests || data;
        setPendingRequests(Array.isArray(requests) ? requests : []);
      } else {
        console.error('Failed to load pending requests');
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPharmacyStock = async () => {
    try {
      const response = await fetch('/api/pharmacist/stock');
      if (response.ok) {
        const data = await response.json();
        console.log('Pharmacy stock data:', data);
        // Handle both direct array and nested object responses
        const stock = data.stock || data;
        setPharmacyStock(Array.isArray(stock) ? stock : []);
      } else {
        console.error('Failed to load pharmacy stock');
        setPharmacyStock([]);
      }
    } catch (error) {
      console.error('Error loading pharmacy stock:', error);
      setPharmacyStock([]);
    }
  };

  const loadLowStockItems = async () => {
    try {
      const response = await fetch('/api/pharmacist/low-stock');
      if (response.ok) {
        const data = await response.json();
        console.log('Low stock data:', data);
        // Handle both direct array and nested object responses
        const lowStock = data.lowStock || data.items || data;
        setLowStockItems(Array.isArray(lowStock) ? lowStock : []);
      } else {
        console.error('Failed to load low stock items');
        setLowStockItems([]);
      }
    } catch (error) {
      console.error('Error loading low stock items:', error);
      setLowStockItems([]);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/pharmacist/transactions');
      if (response.ok) {
        const data = await response.json();
        console.log('Transactions data:', data);
        // Handle both direct array and nested object responses
        const transactions = data.transactions || data;
        setTransactions(Array.isArray(transactions) ? transactions : []);
      } else {
        console.error('Failed to load transactions');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    }
  };

  const handleApproveRequest = async (request: SupplyRequest) => {
    setSelectedRequest(request);
    setIsApprovalModalOpen(true);
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!currentUser?.id) {
      alert('Authentication error: Please log in again.');
      return;
    }

    try {
      const response = await fetch('/api/pharmacist/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          approved_quantity: 0, // 0 means rejected
          pharmacist_id: currentUser.id,
          approval_notes: 'Request rejected'
        })
      });

      if (response.ok) {
        loadPendingRequests(); // Refresh the list
        alert('Request rejected successfully');
      } else {
        console.error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const confirmApproval = async () => {
    if (!selectedRequest || !currentUser?.id) {
      if (!currentUser?.id) {
        alert('Authentication error: Please log in again.');
      }
      return;
    }
    
    try {
      const response = await fetch('/api/pharmacist/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          approved_quantity: selectedRequest.quantity_requested,
          pharmacist_id: currentUser.id,
          approval_notes: approvalNotes || 'Approved by pharmacist'
        })
      });

      if (response.ok) {
        setIsApprovalModalOpen(false);
        setSelectedRequest(null);
        setApprovalNotes('');
        loadPendingRequests();
        loadPharmacyStock();
        loadTransactions();
        alert('Request approved successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to approve request:', errorData);
        alert(`Failed to approve request: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const updateStock = async (stockId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/pharmacist/stock/${stockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updateData,
          pharmacist_id: currentUser.id,
          update_type: 'adjustment'
        })
      });

      if (response.ok) {
        loadPharmacyStock();
        loadLowStockItems();
        loadTransactions();
        alert('Stock updated successfully');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const addNewStock = async () => {
    try {
      const response = await fetch('/api/pharmacist/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...stockForm,
          pharmacist_id: currentUser.id
        })
      });

      if (response.ok) {
        setIsAddStockModalOpen(false);
        setStockForm({
          supply_name: '',
          supply_category: '',
          current_stock: 0,
          minimum_stock_level: 0,
          maximum_stock_level: 0,
          unit: '',
          cost_per_unit: 0,
          supplier: '',
          batch_number: '',
          expiry_date: '',
          notes: ''
        });
        loadPharmacyStock();
        loadLowStockItems();
        alert('New stock added successfully');
      }
    } catch (error) {
      console.error('Error adding new stock:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusIcon = (current: number, minimum: number) => {
    if (current === 0) return <XCircle className="h-4 w-4 text-red-500" />;
    if (current <= minimum) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  // Show loading state while authenticating
  if (loadingAuth) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pharmacist dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Please log in to access the pharmacy dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {currentUser.first_name || currentUser.username}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Compact Modern Tabs */}
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-xl p-1 h-12">
            <TabsTrigger 
              value="requests" 
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <Clock className="h-4 w-4" />
              Requests
              <Badge variant="secondary" className="ml-1 h-5 text-xs">
                {Array.isArray(pendingRequests) ? pendingRequests.length : 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="stock" 
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <Package className="h-4 w-4" />
              Stock
              <Badge variant="secondary" className="ml-1 h-5 text-xs">
                {Array.isArray(pharmacyStock) ? pharmacyStock.length : 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="low-stock" 
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <AlertTriangle className="h-4 w-4" />
              Alerts
              <Badge variant="destructive" className="ml-1 h-5 text-xs">
                {Array.isArray(lowStockItems) ? lowStockItems.length : 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

        {/* Supply Requests Tab */}
        <TabsContent value="requests">
          <Card className="shadow-sm border-0 bg-white rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Pending Supply Requests
                </CardTitle>
                <Button onClick={loadPendingRequests} variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No pending requests</p>
                  <p className="text-sm text-gray-400">All supply requests have been processed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(pendingRequests) && pendingRequests.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{request.supply_name}</h3>
                            <Badge className={`text-xs px-2 py-1 ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div><span className="font-medium">Ward:</span> {request.ward_name}</div>
                            <div><span className="font-medium">Requested by:</span> {request.requested_by_name}</div>
                            <div><span className="font-medium">Quantity:</span> {request.quantity_requested} {request.unit}</div>
                            <div><span className="font-medium">Available:</span> {request.pharmacy_stock} {request.unit}</div>
                            <div className="col-span-2"><span className="font-medium">Reason:</span> {request.request_reason}</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Requested: {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleApproveRequest(request)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs h-8"
                            disabled={request.pharmacy_stock < request.quantity_requested}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 text-xs h-8"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      {request.pharmacy_stock < request.quantity_requested && (
                        <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                          <p className="text-sm text-red-700 font-medium">⚠️ Insufficient stock available</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Management Tab */}
        <TabsContent value="stock">
          <Card className="shadow-sm border-0 bg-white rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Pharmacy Stock
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsAddStockModalOpen(true)} 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stock
                  </Button>
                  <Button onClick={loadPharmacyStock} variant="outline" size="sm" className="h-9 w-9 p-0">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading stock...</p>
                </div>
              ) : pharmacyStock.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No stock items</p>
                  <p className="text-sm text-gray-400">Add your first stock item to get started</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  {Array.isArray(pharmacyStock) && pharmacyStock.map((stock) => (
                    <div key={stock.id} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            {getStockStatusIcon(stock.current_stock, stock.minimum_stock_level)}
                            <h3 className="font-semibold text-gray-900">{stock.supply_name}</h3>
                            <Badge variant="outline" className="text-xs">{stock.supply_category}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-gray-500">Current Stock</p>
                              <p className="font-semibold text-gray-900">{stock.current_stock} {stock.unit}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">Min Level</p>
                              <p className="font-semibold text-gray-900">{stock.minimum_stock_level} {stock.unit}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">Cost/Unit</p>
                              <p className="font-semibold text-gray-900">${stock.cost_per_unit}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">Supplier</p>
                              <p className="font-medium text-gray-700 truncate">{stock.supplier}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">Batch</p>
                              <p className="font-medium text-gray-700">{stock.batch_number}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">Expiry</p>
                              <p className="font-medium text-gray-700">{stock.expiry_date || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedStock(stock)} className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white pb-4">
                              <DialogHeader>
                                <DialogTitle>Edit Stock: {stock.supply_name}</DialogTitle>
                              </DialogHeader>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Current Stock</label>
                                <Input
                                  type="number"
                                  id={`newQuantity-${stock.id}`}
                                  defaultValue={stock.current_stock}
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Minimum Level</label>
                                <Input
                                  type="number"
                                  id={`minLevel-${stock.id}`}
                                  defaultValue={stock.minimum_stock_level}
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Cost per Unit</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  id={`costPerUnit-${stock.id}`}
                                  defaultValue={stock.cost_per_unit}
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Supplier</label>
                                <Input
                                  id={`supplier-${stock.id}`}
                                  defaultValue={stock.supplier}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Batch Number</label>
                                <Input
                                  id={`batchNumber-${stock.id}`}
                                  defaultValue={stock.batch_number}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                <Input
                                  type="date"
                                  id={`expiryDate-${stock.id}`}
                                  defaultValue={stock.expiry_date}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <Textarea
                                  id={`notes-${stock.id}`}
                                  defaultValue={stock.notes}
                                  rows={3}
                                />
                              </div>
                            </div>
                            <div className="sticky bottom-0 bg-white pt-4 flex justify-end gap-2">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                onClick={() => {
                                  const newQuantityValue = (document.getElementById(`newQuantity-${stock.id}`) as HTMLInputElement)?.value;
                                  const minLevelValue = (document.getElementById(`minLevel-${stock.id}`) as HTMLInputElement)?.value;
                                  const costPerUnitValue = (document.getElementById(`costPerUnit-${stock.id}`) as HTMLInputElement)?.value;
                                  const supplierValue = (document.getElementById(`supplier-${stock.id}`) as HTMLInputElement)?.value;
                                  const batchNumberValue = (document.getElementById(`batchNumber-${stock.id}`) as HTMLInputElement)?.value;
                                  const expiryDateValue = (document.getElementById(`expiryDate-${stock.id}`) as HTMLInputElement)?.value;
                                  const notesValue = (document.getElementById(`notes-${stock.id}`) as HTMLTextAreaElement)?.value;
                                  
                                  if (newQuantityValue) {
                                    updateStock(stock.id, {
                                      current_stock: parseInt(newQuantityValue),
                                      minimum_stock_level: parseInt(minLevelValue) || stock.minimum_stock_level,
                                      cost_per_unit: parseFloat(costPerUnitValue) || stock.cost_per_unit,
                                      supplier: supplierValue || stock.supplier,
                                      batch_number: batchNumberValue || stock.batch_number,
                                      expiry_date: expiryDateValue || stock.expiry_date,
                                      notes: notesValue || stock.notes
                                    });
                                  }
                                }}
                              >
                                Update Stock
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="low-stock">
          <Card className="shadow-sm border-0 bg-white rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Low Stock Alerts
                {lowStockItems.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{lowStockItems.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Checking stock levels...</p>
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">All stock levels are healthy</p>
                  <p className="text-sm text-gray-400">No items are running low</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(lowStockItems) && lowStockItems.map((item) => (
                    <div key={item.id} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.supply_name}</h3>
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-500">Current:</span>
                              <span className="ml-2 font-semibold text-red-600">{item.current_stock} {item.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Required:</span>
                              <span className="ml-2 font-semibold text-gray-900">{item.minimum_stock_level} {item.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Category:</span>
                              <span className="ml-2 font-medium text-gray-700">{item.supply_category}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {Math.round((item.current_stock / item.minimum_stock_level) * 100)}% stock
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="shadow-sm border-0 bg-white rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No transactions yet</p>
                  <p className="text-sm text-gray-400">Transactions will appear here once stock movements occur</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(transactions) && transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {transaction.transaction_type === 'transfer_to_ward' ? 
                            <ArrowUpRight className="h-4 w-4 text-orange-600" /> :
                            <Plus className="h-4 w-4 text-green-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={transaction.transaction_type === 'transfer_to_ward' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{transaction.supply_name || 'Unknown Supply'}</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Quantity:</span>
                              <span className="ml-1 font-semibold">{transaction.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Stock:</span>
                              <span className="ml-1 font-medium">{transaction.previous_stock} → {transaction.new_stock}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Ward:</span>
                              <span className="ml-1 font-medium">{transaction.ward_name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">By:</span>
                              <span className="ml-1 font-medium">{transaction.pharmacist_name || 'System'}</span>
                            </div>
                          </div>
                          {transaction.notes && (
                            <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded border-l-2 border-gray-300">
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Supply Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold">{selectedRequest.supply_name}</h3>
                <p className="text-sm">Ward: {selectedRequest.ward_name}</p>
                <p className="text-sm">Requested: {selectedRequest.quantity_requested} {selectedRequest.unit}</p>
                <p className="text-sm">Available: {selectedRequest.pharmacy_stock} {selectedRequest.unit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Approval Notes</label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmApproval}>
                  Confirm Approval
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Stock Modal */}
      <Dialog open={isAddStockModalOpen} onOpenChange={setIsAddStockModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white pb-4">
            <DialogHeader>
              <DialogTitle>Add New Stock Item</DialogTitle>
            </DialogHeader>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supply Name *</label>
              <Input
                value={stockForm.supply_name}
                onChange={(e) => setStockForm({...stockForm, supply_name: e.target.value})}
                placeholder="Enter supply name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select value={stockForm.supply_category} onValueChange={(value) => setStockForm({...stockForm, supply_category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="medical-supplies">Medical Supplies</SelectItem>
                  <SelectItem value="surgical-instruments">Surgical Instruments</SelectItem>
                  <SelectItem value="consumables">Consumables</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Stock *</label>
                <Input
                  type="number"
                  value={stockForm.current_stock}
                  onChange={(e) => setStockForm({...stockForm, current_stock: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <Input
                  value={stockForm.unit}
                  onChange={(e) => setStockForm({...stockForm, unit: e.target.value})}
                  placeholder="e.g., tablets, boxes"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Min Level</label>
                <Input
                  type="number"
                  value={stockForm.minimum_stock_level}
                  onChange={(e) => setStockForm({...stockForm, minimum_stock_level: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Level</label>
                <Input
                  type="number"
                  value={stockForm.maximum_stock_level}
                  onChange={(e) => setStockForm({...stockForm, maximum_stock_level: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost per Unit</label>
              <Input
                type="number"
                step="0.01"
                value={stockForm.cost_per_unit}
                onChange={(e) => setStockForm({...stockForm, cost_per_unit: parseFloat(e.target.value) || 0})}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <Input
                value={stockForm.supplier}
                onChange={(e) => setStockForm({...stockForm, supplier: e.target.value})}
                placeholder="Supplier name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Batch Number</label>
                <Input
                  value={stockForm.batch_number}
                  onChange={(e) => setStockForm({...stockForm, batch_number: e.target.value})}
                  placeholder="Batch number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={stockForm.expiry_date}
                  onChange={(e) => setStockForm({...stockForm, expiry_date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                value={stockForm.notes}
                onChange={(e) => setStockForm({...stockForm, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <div className="sticky bottom-0 bg-white pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddStockModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addNewStock} disabled={!stockForm.supply_name}>
              Add Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default PharmacistDashboard;