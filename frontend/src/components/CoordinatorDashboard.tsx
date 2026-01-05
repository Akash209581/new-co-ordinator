import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamRegistrationNew from './TeamRegistrationNew';
import './CoordinatorDashboard.css';

interface DashboardStats {
  totalEvents: number;
  activeParticipants: number;
  pendingApprovals: number;
  completedTasks: number;
  totalPayments?: number;
  totalAmount?: number;
  paidCount?: number;
  pendingCount?: number;
  collectionRate?: number;
}

interface ActivityItem {
  time: string;
  activity: string;
  status?: string;
  timestamp?: string;
}

interface Participant {
  participantId: string;
  userId?: string;  // Primary ID from registrations collection
  name: string;
  email: string;
  phoneNumber: string;
  college: string;
  department?: string;
  year?: string;
  rollNumber?: string;
  userType?: string;
  participationType?: string;
  event: string | {
    title: string;
    registrationFee: number;
  };
  eventNames?: string[];
  registeredEvents?: any[];
  gender?: string;
  registrationStatus: string;
  paymentStatus: string;
  paymentAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  processedBy?: any;
  paymentNotes?: string;
  teamMembers?: any[];
}

interface PaymentProcessData {
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'bank_transfer';
  notes: string;
}

const CoordinatorDashboard: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [coordinatorName, setCoordinatorName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'unpaid' | 'team'>('dashboard');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeParticipants: 0,
    pendingApprovals: 0,
    completedTasks: 0
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Payment management states
  const [searchId, setSearchId] = useState<string>('');
  const [searchedParticipant, setSearchedParticipant] = useState<Participant | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchError, setSearchError] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showSearchSuggestions, setShowSearchSuggestions] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentProcessData>({
    amount: 0,
    method: 'cash',
    notes: ''
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [paymentSuccess, setPaymentSuccess] = useState<string>('');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [totalPaymentsProcessed, setTotalPaymentsProcessed] = useState<number>(0);
  const [totalAmountCollected, setTotalAmountCollected] = useState<number>(0);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  
  // Payment editing states
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    paymentStatus: string;
    paidAmount: string;
    paymentMethod: string;
    paymentNotes: string;
  }>({
    paymentStatus: '',
    paidAmount: '',
    paymentMethod: 'cash',
    paymentNotes: ''
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updatingPayment, setUpdatingPayment] = useState<boolean>(false);
  
  // Unpaid participants states
  const [unpaidParticipants, setUnpaidParticipants] = useState<any[]>([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState<boolean>(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [unpaidSearchQuery, setUnpaidSearchQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingAmount, setEditingAmount] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editedAmounts, setEditedAmounts] = useState<{[key: string]: number}>({});
  const [participantTypes, setParticipantTypes] = useState<{[key: string]: string}>({});
  const [participantGenders, setParticipantGenders] = useState<{[key: string]: string}>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [paidParticipantsCount, setPaidParticipantsCount] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [unpaidParticipantsCount, setUnpaidParticipantsCount] = useState<number>(0);
  
  // Team registration states
  const [teamRegistrations, setTeamRegistrations] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>('');
  const [showTeamCreation, setShowTeamCreation] = useState<boolean>(false);
  
  // Event registration modal states
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [registeringEvents, setRegisteringEvents] = useState<boolean>(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  
  const navigate = useNavigate();

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Helper function to get the ID (prefer userId over participantId)
  const getParticipantId = (participant: Participant): string => {
    return participant.userId || participant.participantId;
  };

  // Check if participant belongs to Vignan colleges (discounted pricing)
  const isVignanCollege = (college: string): boolean => {
    if (!college) return false;
    const collegeLower = college.toLowerCase();
    
    // Match Vignan Pharmacy College, Vadlamudi
    if (collegeLower.includes('vignan pharmacy') || collegeLower.includes('vadlamudi')) {
      return true;
    }
    
    // Match Vignan Foundation of Science, Technology and Research (VFSTR)
    // Various spellings: "vignans foundation", "vignan's foundation", "vfstr"
    if (collegeLower.includes('vfstr') || 
        (collegeLower.includes('vignan') && collegeLower.includes('foundation') && collegeLower.includes('science'))) {
      return true;
    }
    
    // Match Vignan's Lara Institute of Technology
    if (collegeLower.includes('lara') && collegeLower.includes('vignan')) {
      return true;
    }
    
    // Also match "vignan's lara" or "vignans lara"
    if (collegeLower.includes('lara institute')) {
      return true;
    }
    
    return false;
  };

  // Calculate amount based on selected participant type and gender
  const calculateAmount = (participantId: string, participant?: any): number => {
    // Check if participant is from Vignan colleges - flat ₹150 for all types
    const participantCollege = participant?.college || '';
    if (isVignanCollege(participantCollege)) {
      return 150;
    }
    
    const selectedType = participantTypes[participantId] || 'visitor';
    
    if (selectedType === 'visitor') {
      return 200;
    } else if (selectedType === 'sports' || selectedType === 'cultural' || selectedType === 'both') {
      // All participant types = 200 for non-Vignan colleges
      return 200;
    }
    return 0;
  };

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Get user data
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
      
      // Parse coordinator name if stored
      const storedCoordinator = localStorage.getItem('coordinatorData');
      if (storedCoordinator) {
        const parsed = JSON.parse(storedCoordinator);
        setCoordinatorName(`${parsed.firstName} ${parsed.lastName}`);
      }
    }

    // Fetch dashboard data only once on mount
    fetchDashboardData();
    fetchPaymentHistory();

    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString());
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => clearInterval(timeInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  useEffect(() => {
    // Fetch unpaid participants only when switching to unpaid tab
    if (activeTab === 'unpaid') {
      fetchUnpaidParticipants();
    }
    if (activeTab === 'team') {
      fetchTeamRegistrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-input-container')) {
        setShowSuggestions(false);
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ============ DASHBOARD SYNCHRONIZATION EFFECT ============
  // Ensures Dashboard "Total Proceedings" stays in sync with payment state changes
  useEffect(() => {
    // Derive Dashboard values from payment states (single source of truth)
    const derivedPaymentCount = totalPaymentsProcessed;
    const derivedTotalAmount = totalAmountCollected;
    
    // Update stats if values have changed to keep Dashboard synchronized
    setStats(prev => {
      const needsUpdate = 
        (prev.totalPayments !== derivedPaymentCount) ||
        (prev.totalAmount !== derivedTotalAmount);
      
      if (needsUpdate) {
        return {
          ...prev,
          totalPayments: derivedPaymentCount,
          totalAmount: derivedTotalAmount,
          paidCount: derivedPaymentCount
        };
      }
      return prev;
    });
  }, [totalPaymentsProcessed, totalAmountCollected]);

  // ============ PROCEED TO PAY COUNTER SYNCHRONIZATION ============
  // Derives the paid participants count from actual data (single source of truth)
  useEffect(() => {
    const mergedData = [...unpaidParticipants, ...paymentHistory];
    const paidCount = mergedData.filter(p => p.paymentStatus === 'paid').length;
    setPaidParticipantsCount(paidCount);
  }, [unpaidParticipants, paymentHistory]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/coordinator/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.clear();
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.data.stats);
      setRecentActivities(data.data.recentActivities || []);
      
      // Update payment statistics from dashboard stats (individual coordinator)
      if (data.data.stats.totalPaymentsProcessed !== undefined) {
        setTotalPaymentsProcessed(data.data.stats.totalPaymentsProcessed);
      }
      if (data.data.stats.totalAmountCollected !== undefined) {
        setTotalAmountCollected(data.data.stats.totalAmountCollected);
      }
      if (data.data.stats.cashAmount !== undefined) {
        setCashAmount(data.data.stats.cashAmount);
      }
      if (data.data.stats.upiAmount !== undefined) {
        setUpiAmount(data.data.stats.upiAmount);
      }
      // Update unpaid participants count
      if (data.data.stats.unpaidParticipantsCount !== undefined) {
        setUnpaidParticipantsCount(data.data.stats.unpaidParticipantsCount);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setRecentActivities([
        { time: '10:30 AM', activity: 'Welcome to Mahotsav Dashboard!' },
        { time: '10:00 AM', activity: 'System initialized successfully' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Payment Management Functions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchSearchSuggestions = (query: string) => {
    console.log('fetchSearchSuggestions called with:', query);
    console.log('unpaidParticipants length:', unpaidParticipants.length);
    
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    // Use unpaid participants for suggestions
    const filtered = unpaidParticipants.filter(p => 
      (p.userId || p.participantId || '').toLowerCase().includes(query.toLowerCase()) ||
      (p.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (p.phoneNumber || '').includes(query)
    ).slice(0, 8);
    
    console.log('Filtered suggestions:', filtered);
    setSearchSuggestions(filtered);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const searchParticipant = async () => {
    if (!searchId.trim()) {
      setSearchError('Please enter a participant ID');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchedParticipant(null);
    setPaymentSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const formattedId = searchId.toUpperCase().trim();
      
      const response = await fetch(`http://localhost:5000/api/coordinator/registrations/participant/${formattedId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.message || 'Failed to search participant');
        return;
      }

      setSearchedParticipant(data.participant);
      
      // Calculate payment amount based on participant type and event
      let calculatedAmount = data.participant.paymentAmount;
      const userType = data.participant.userType?.toLowerCase() || '';
      const participationType = data.participant.participationType?.toLowerCase() || '';
      const eventTitle = data.participant.event?.title?.toLowerCase() || '';
      
      // Auto-set amount based on type and event
      if (userType === 'visitor' || participationType === 'visitor') {
        calculatedAmount = 200;
      } else if (userType === 'participant' || participationType === 'participant') {
        // Check if event is sports or cultural
        if (eventTitle.includes('sport') || eventTitle.includes('cricket') || 
            eventTitle.includes('football') || eventTitle.includes('basketball') ||
            eventTitle.includes('volleyball') || eventTitle.includes('badminton') ||
            eventTitle.includes('chess') || eventTitle.includes('carrom')) {
          calculatedAmount = 350;
        } else if (eventTitle.includes('cultural') || eventTitle.includes('dance') || 
                   eventTitle.includes('music') || eventTitle.includes('drama') ||
                   eventTitle.includes('singing') || eventTitle.includes('skit')) {
          calculatedAmount = 350;
        }
      }
      
      // Set default payment amount to remaining amount (considering already paid)
      const remaining = calculatedAmount - data.participant.paidAmount;
      setPaymentData(prev => ({
        ...prev,
        amount: Math.max(0, remaining)
      }));

    } catch (error) {
      console.error('Error searching participant:', error);
      setSearchError('Network error while searching participant');
    } finally {
      setSearchLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const startEditPayment = (participant: any) => {
    const id = getParticipantId(participant);
    setEditingPayment(id);
    setEditData({
      paymentStatus: participant.paymentStatus,
      paidAmount: participant.paidAmount.toString(),
      paymentMethod: participant.paymentMethod || 'cash',
      paymentNotes: participant.paymentNotes || ''
    });
  };

  const cancelEditPayment = () => {
    setEditingPayment(null);
    setEditData({
      paymentStatus: '',
      paidAmount: '',
      paymentMethod: 'cash',
      paymentNotes: ''
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updatePayment = async (participantId: string) => {
    if (!editData.paymentStatus && !editData.paidAmount && !editData.paymentMethod && !editData.paymentNotes) {
      alert('Please make at least one change to update the payment');
      return;
    }

    setUpdatingPayment(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        navigate('/login');
        return;
      }
         
      const updatePayload: any = {};
      
      if (editData.paymentStatus) updatePayload.paymentStatus = editData.paymentStatus;
      if (editData.paidAmount) updatePayload.paidAmount = parseFloat(editData.paidAmount);
      if (editData.paymentMethod) updatePayload.paymentMethod = editData.paymentMethod;
      if (editData.paymentNotes) updatePayload.paymentNotes = editData.paymentNotes;

      console.log('Updating payment with payload:', updatePayload);

      const response = await fetch(`http://localhost:5000/api/coordinator/registrations/update/${participantId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || `Error updating payment: ${response.status} ${response.statusText}`);
        setUpdatingPayment(false);
        return;
      }

      const data = await response.json();

      alert('Payment updated successfully!');
      
      // Refresh payment history
      await fetchPaymentHistory().catch(err => console.error('Error refreshing payment history:', err));
      
      // Refresh dashboard stats to update proceedings count
      await fetchDashboardData().catch(err => console.error('Error refreshing dashboard:', err));
      
      // Refresh unpaid participants list in case status changed affects it (only if on that tab)
      if (activeTab === 'unpaid') {
        await fetchUnpaidParticipants().catch(err => console.error('Error refreshing unpaid list:', err));
      }
      
      // If the updated participant is currently searched, update that too
      if (searchedParticipant && getParticipantId(searchedParticipant) === participantId) {
        setSearchedParticipant(prev => prev ? {
          ...prev,
          paymentStatus: data.participant.paymentStatus,
          paidAmount: data.participant.paidAmount,
          paymentDate: data.participant.paymentDate,
          paymentMethod: data.participant.paymentMethod,
          paymentNotes: data.participant.paymentNotes
        } : null);
      }

      // Close edit mode
      cancelEditPayment();

    } catch (error: any) {
      console.error('Error updating payment:', error);
      const errorMessage = error?.message || 'Network error while updating payment. Please check your connection and try again.';
      alert(errorMessage);
    } finally {
      setUpdatingPayment(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetPayment = async (participantId: string) => {
    if (!window.confirm('Are you sure you want to reset this payment? This will clear all payment details.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:5000/api/coordinator/registrations/reset/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Error resetting payment');
        return;
      }

      alert('Payment reset successfully!');
      
      // Refresh payment history
      fetchPaymentHistory();
      
      // If the reset participant is currently searched, update that too
      if (searchedParticipant && getParticipantId(searchedParticipant) === participantId) {
        setSearchedParticipant(prev => prev ? {
          ...prev,
          paymentStatus: 'pending',
          paidAmount: 0,
          paymentDate: '',
          paymentMethod: '',
          paymentNotes: ''
        } : null);
      }

    } catch (error) {
      console.error('Error resetting payment:', error);
      alert('Network error while resetting payment');
    }
  };

  const fetchUnpaidParticipants = async () => {
    setLoadingUnpaid(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:5000/api/coordinator/registrations/unpaid', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Unpaid participants response:', data);
        console.log('First participant:', data.participants?.[0]);
        setUnpaidParticipants(data.participants || data.registrations || []);
      } else {
        console.error('Error fetching unpaid participants');
      }
    } catch (error) {
      console.error('Error fetching unpaid participants:', error);
    } finally {
      setLoadingUnpaid(false);
    }
  };

  const fetchTeamRegistrations = async () => {
    setLoadingTeams(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:5000/api/coordinator/eventRegistrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Team registrations API response:', data);
        console.log('Count:', data.count);
        console.log('Registrations array:', data.registrations);
        
        // The backend already filters for userType: "participant", so no need to filter again
        const participantTeams = data.registrations || [];
        console.log('Setting team registrations:', participantTeams.length, 'items');
        setTeamRegistrations(participantTeams);
      } else {
        console.error('Error fetching team registrations. Status:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching team registrations:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const markAsPaid = async (participantId: string, paymentMethod: string = 'cash', customAmount?: number) => {
    setMarkingPaid(participantId);
    
    try {
      const token = localStorage.getItem('authToken');
      
      // ============ STEP 1: FIND PARTICIPANT & VALIDATE ============
      const mergedData = [...unpaidParticipants, ...paymentHistory];
      const participant = mergedData.find(p => getParticipantId(p) === participantId);
      
      if (!participant) {
        showToast('Participant not found', 'error');
        setMarkingPaid(null);
        return;
      }
      
      // CRITICAL: Use Number() to ensure numeric type and prevent string concatenation
      const amountToPay = Number(customAmount !== undefined ? customAmount : (participant.remainingAmount || participant.paymentAmount || 0));
      
      if (isNaN(amountToPay) || amountToPay <= 0) {
        showToast('Invalid payment amount', 'error');
        setMarkingPaid(null);
        return;
      }
      
      const requestBody: any = {
        paymentMethod,
        paymentNotes: 'Marked as paid from proceed to pay list'
      };
      
      if (customAmount !== undefined) {
        requestBody.amount = customAmount;
      }
      
      // ============ STEP 2: API CALL ============
      const response = await fetch(`http://localhost:5000/api/coordinator/registrations/mark-paid/${participantId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Error marking as paid', 'error');
        setMarkingPaid(null);
        return;
      }

      // ============ STEP 3: ATOMIC STATE SYNCHRONIZATION ============
      const currentTimestamp = new Date().toISOString();
      const updatedParticipant = {
        ...participant,
        paymentStatus: 'paid',
        paidAmount: amountToPay,
        paymentMethod,
        paymentDate: currentTimestamp,
        remainingAmount: 0, // Ensure remaining amount is zero for paid users
        // Preserve event data to show after payment
        event: participant.event,
        eventNames: participant.eventNames,
        registeredEvents: participant.registeredEvents,
        userType: participant.userType,
        participationType: participant.participationType
      };
      
      // 3.1 Update unpaidParticipants - Mark as paid (change status)
      setUnpaidParticipants(prev => 
        prev.map(p => 
          getParticipantId(p) === participantId 
            ? updatedParticipant
            : p
        )
      );
      
      // 3.2 Update paymentHistory - Ensure participant appears in paid list
      setPaymentHistory(prev => {
        const existingIndex = prev.findIndex(p => getParticipantId(p) === participantId);
        if (existingIndex >= 0) {
          // Update existing entry
          const updated = [...prev];
          updated[existingIndex] = updatedParticipant;
          return updated;
        } else {
          // Add to payment history (so it appears in default "paid only" view)
          return [updatedParticipant, ...prev];
        }
      });
      
      // 3.3 Update Dashboard Statistics - Atomic functional updates
      setTotalPaymentsProcessed(prev => Number(prev) + 1);
      setTotalAmountCollected(prev => Number(prev) + Number(amountToPay));
      
      // 3.4 Update payment method specific totals
      if (paymentMethod === 'cash') {
        setCashAmount(prev => Number(prev) + Number(amountToPay));
      } else if (paymentMethod === 'upi') {
        setUpiAmount(prev => Number(prev) + Number(amountToPay));
      }
      
      // 3.5 Update global stats (for Dashboard Total Proceedings synchronization)
      setStats(prev => ({
        ...prev,
        paidCount: Number(prev.paidCount || 0) + 1,
        totalAmount: Number(prev.totalAmount || 0) + Number(amountToPay),
        totalPayments: Number(prev.totalPayments || 0) + 1
      }));
      
      // 3.6 Update Proceed to Pay section counter (Real-time synchronization)
      setPaidParticipantsCount(prev => Number(prev) + 1);
      setUnpaidParticipantsCount(prev => Math.max(0, Number(prev) - 1));
      
      // ============ STEP 4: UI FEEDBACK ============
      showToast(
        `✓ ${data.participant.name} marked as paid! Dashboard totals updated successfully. (₹${amountToPay.toLocaleString('en-IN')})`,
        'success'
      );
      
      // ============ STEP 5: BACKGROUND SYNC (DELAYED) ============
      // Only refresh dashboard stats, not the participant lists to preserve event data
      setTimeout(() => {
        fetchDashboardData().catch(err => console.error('Background sync error:', err));
      }, 2000);

    } catch (error) {
      console.error('Error marking as paid:', error);
      showToast('Network error while marking as paid', 'error');
    } finally {
      setMarkingPaid(null);
    }
  };

  // Open event registration modal
  const openEventRegistrationModal = async (participant: Participant) => {
    console.log('🔍 Opening event modal for participant:', participant);
    setSelectedParticipant(participant);
    setShowEventModal(true);
    setLoadingEvents(true);

    try {
      const token = localStorage.getItem('authToken');
      const participantId = getParticipantId(participant);
      const userType = participantTypes[participantId] || participant.userType || participant.participationType;
      
      console.log('📋 Participant ID:', participantId);
      console.log('📋 User Type:', userType);
      console.log('📋 participantTypes:', participantTypes);
      
      // Determine category based on user type
      let category = '';
      if (userType === 'sports') {
        category = 'sports';
      } else if (userType === 'cultural') {
        category = 'cultural';
      } else if (userType === 'both') {
        category = 'both';
      }

      console.log('🎯 Category to fetch:', category);

      const url = category 
        ? `http://localhost:5000/api/coordinator/events?category=${category}&forRegistration=true&limit=1000`
        : 'http://localhost:5000/api/coordinator/events?forRegistration=true&limit=1000';

      console.log('🌐 Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Full Response data:', JSON.stringify(data, null, 2));
      
      // The backend now returns events at root level when forRegistration=true
      const events = data.events || [];
      console.log('📦 Extracted events length:', events.length);
      if (events.length > 0) {
        console.log('📦 First event sample:', events[0]);
      }

      if (response.ok && data.success) {
        console.log('✅ Events loaded:', events.length);
        
        // Filter events by gender
        const participantGender = (participantGenders[participantId] || participant.gender || 'male').toLowerCase();
        console.log('👤 Participant gender:', participantGender);
        
        const filteredEvents = events.filter((event: any) => {
          const eventTitle = (event.title || '').toLowerCase();
          const eventDescription = (event.description || '').toLowerCase();
          const eventText = eventTitle + ' ' + eventDescription;
          
          // Check if event is gender-specific
          const isMaleEvent = eventText.includes('men') || eventText.includes('male') || eventText.includes("men's") || eventText.includes('boys');
          const isFemaleEvent = eventText.includes('women') || eventText.includes('female') || eventText.includes("women's") || eventText.includes('girls');
          
          // If event has no gender specification, show to all
          if (!isMaleEvent && !isFemaleEvent) {
            return true;
          }
          
          // If participant is male, show only male events and non-gender-specific events
          if (participantGender === 'male' && isMaleEvent && !isFemaleEvent) {
            return true;
          }
          
          // If participant is female, show only female events and non-gender-specific events
          if (participantGender === 'female' && isFemaleEvent && !isMaleEvent) {
            return true;
          }
          
          return false;
        });
        
        console.log('🎯 Filtered events by gender:', filteredEvents.length);
        setAvailableEvents(filteredEvents);
        setLoadingEvents(false);
        
        // Pre-select events if participant already has registered events
        if (participant.registeredEvents && Array.isArray(participant.registeredEvents)) {
          const registeredEventIds = participant.registeredEvents
            .map((re: any) => re.eventId || re._id)
            .filter((id: any) => id);
          console.log('🔖 Pre-selecting registered events:', registeredEventIds);
          setSelectedEventIds(registeredEventIds);
        } else if (participant.eventNames && participant.eventNames.length > 0) {
          // Try to match by event names
          const matchedEventIds = filteredEvents
            .filter((event: any) => participant.eventNames?.includes(event.title))
            .map((event: any) => event._id);
          console.log('🔖 Pre-selecting by name match:', matchedEventIds);
          setSelectedEventIds(matchedEventIds);
        } else {
          setSelectedEventIds([]);
        }
      } else {
        console.error('❌ Failed to load events:', data.message);
        showToast(data.message || 'Failed to load events', 'error');
        setAvailableEvents([]);
        setSelectedEventIds([]);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      showToast('Network error while loading events', 'error');
      setAvailableEvents([]);
      setSelectedEventIds([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Close event registration modal
  const closeEventRegistrationModal = () => {
    setShowEventModal(false);
    setSelectedParticipant(null);
    setAvailableEvents([]);
    setSelectedEventIds([]);
  };

  // Toggle event selection
  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  // Register participant for selected events
  const registerForEvents = async () => {
    if (!selectedParticipant || selectedEventIds.length === 0) {
      showToast('Please select at least one event', 'error');
      return;
    }

    setRegisteringEvents(true);

    try {
      const token = localStorage.getItem('authToken');
      const participantId = getParticipantId(selectedParticipant);

      const response = await fetch('http://localhost:5000/api/coordinator/events/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: participantId,
          eventIds: selectedEventIds
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(`Successfully registered for ${data.registeredCount} event(s)!`, 'success');
        
        // Update the participant in the unpaidParticipants list
        setUnpaidParticipants(prev => 
          prev.map(p => {
            if (getParticipantId(p) === participantId) {
              return {
                ...p,
                eventNames: data.eventNames || [],
                registeredEvents: data.allRegisteredEvents || [],
                event: data.eventNames && data.eventNames.length > 0 ? data.eventNames[0] : p.event
              };
            }
            return p;
          })
        );

        // Close modal
        closeEventRegistrationModal();
        
        // Refresh the unpaid participants list
        fetchUnpaidParticipants();
      } else {
        showToast(data.message || 'Failed to register for events', 'error');
      }
    } catch (error) {
      console.error('Error registering for events:', error);
      showToast('Network error while registering for events', 'error');
    } finally {
      setRegisteringEvents(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processPayment = async () => {
    if (!searchedParticipant) return;

    if (paymentData.amount <= 0) {
      setSearchError('Please enter a valid payment amount');
      return;
    }

    setProcessingPayment(true);
    setSearchError('');
    setPaymentSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const participantId = getParticipantId(searchedParticipant);
      
      const response = await fetch(`http://localhost:5000/api/coordinator/registrations/process/${participantId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.message || 'Failed to process payment');
        return;
      }

      setPaymentSuccess(`Payment of ₹${paymentData.amount} processed successfully!`);
      
      // Update the participant data
      setSearchedParticipant(prev => prev ? {
        ...prev,
        paymentStatus: data.participant.paymentStatus,
        paidAmount: data.participant.paidAmount,
        paymentDate: data.participant.paymentDate,
        paymentMethod: data.participant.paymentMethod,
        paymentNotes: data.participant.paymentNotes
      } : null);

      // Reset payment form
      setPaymentData({
        amount: Math.max(0, data.participant.remainingAmount || 0),
        method: 'cash',
        notes: ''
      });

      // Refresh dashboard stats
      fetchDashboardData();
      fetchPaymentHistory();

    } catch (error) {
      console.error('Error processing payment:', error);
      setSearchError('Network error while processing payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:5000/api/coordinator/registrations/my-payments?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
        
        // Set the total count to ONLY paid payments
        if (data.statistics && data.statistics.paidCount !== undefined) {
          setTotalPaymentsProcessed(data.statistics.paidCount);
        } else {
          // Fallback: count paid payments from the payment history
          const paidCount = (data.payments || []).filter((p: any) => p.paymentStatus === 'paid').length;
          setTotalPaymentsProcessed(paidCount);
        }
        
        // Calculate total amount collected from paid payments
        const paidPayments = (data.payments || []).filter((p: any) => p.paymentStatus === 'paid');
        
        if (data.statistics && data.statistics.totalAmount !== undefined) {
          setTotalAmountCollected(data.statistics.totalAmount);
        } else {
          // Fallback: calculate from payment history
          const totalAmount = paidPayments.reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0);
          setTotalAmountCollected(totalAmount);
        }
        
        // Calculate cash and UPI amounts separately
        const cashTotal = paidPayments
          .filter((p: any) => p.paymentMethod === 'cash')
          .reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0);
        
        const upiTotal = paidPayments
          .filter((p: any) => p.paymentMethod === 'upi')
          .reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0);
        
        setCashAmount(cashTotal);
        setUpiAmount(upiTotal);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clearSearch = () => {
    setSearchId('');
    setSearchedParticipant(null);
    setSearchError('');
    setPaymentSuccess('');
    setPaymentData({
      amount: 0,
      method: 'cash',
      notes: ''
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // Memoized filtering logic for Proceed to Pay: merge datasets and apply conditional display rules
  const filteredProceedToPayParticipants = useMemo(() => {
    const mergedData = [...unpaidParticipants, ...paymentHistory];
    
    // DEFAULT VIEW: Show only paid users
    if (!unpaidSearchQuery || unpaidSearchQuery.trim() === '') {
      return mergedData.filter(p => p.paymentStatus === 'paid');
    }
    
    // SEARCH VIEW: Show both paid and unpaid matching search criteria
    const query = unpaidSearchQuery.toLowerCase().trim();
    return mergedData.filter(participant => {
      const participantId = getParticipantId(participant);
      return (
        (participantId || '').toLowerCase().includes(query) ||
        (participant.name || '').toLowerCase().includes(query) ||
        (participant.event || '').toLowerCase().includes(query) ||
        (participant.phoneNumber || '').includes(query) ||
        (participant.department || '').toLowerCase().includes(query)
      );
    });
  }, [unpaidParticipants, paymentHistory, unpaidSearchQuery]);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Decorative Background Elements */}
      <div className="background-decorations">
        <div className="mahotsav-logo-bg">
          <img src="/image.avif" alt="Mahotsav Logo" />
        </div>
        <div className="vignan-logo-bg">
          <img src="/Vignan-logo.avif" alt="Vignan Logo" />
        </div>
        <div className="lotus-petals-bg">
          <img src="/petals.avif" alt="Lotus Petals" />
        </div>
        <div className="sun-element-bg">
          <img src="/sun.avif" alt="Sun" />
        </div>
        <div className="moon-element-bg">
          <img src="/moon.avif" alt="Moon" />
        </div>
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎊 Mahotsav Coordinator</h1>
          <p>Welcome back, {coordinatorName || username}!</p>
        </div>
        <div className="header-right">
          <div className="current-time">{currentTime}</div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
        <nav className="dashboard-nav">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'unpaid' ? 'active' : ''}`}
            onClick={() => setActiveTab('unpaid')}
          >
            💳 Proceed to Pay
          </button>
          <button 
            className={`nav-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            👥 Team Registration
          </button>
        </nav>      {/* Main Content */}
      <div className="dashboard-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <section className="dashboard-background-section">
            {/* Professional Statistics Card */}
            <div className="professional-stats-card">
              {/* Primary Metric - Total Amount */}
              <div className="stats-primary">
                <div className="stats-icon primary">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className="stats-main-content">
                  <div className="stats-label">Total Amount Collected</div>
                  <div className="stats-amount" data-amount={totalAmountCollected}>
                    ₹{totalAmountCollected.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Secondary Metrics Row */}
              <div className="stats-secondary-single">
                <div className="stats-metric">
                  <div className="metric-icon transactions">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M2 10h20"/>
                    </svg>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{totalPaymentsProcessed}</div>
                    <div className="metric-label">Transactions</div>
                  </div>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div className="payment-methods">
                <div className="methods-header">
                  <span className="methods-title">Payment Methods</span>
                  <span className="methods-total">{totalPaymentsProcessed} payments</span>
                </div>

                {/* Cash Progress Bar */}
                <div className="method-item">
                  <div className="method-header">
                    <div className="method-info">
                      <div className="method-icon cash-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </div>
                      <span className="method-name">Cash</span>
                    </div>
                    <div className="method-amount">₹{cashAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="method-progress">
                    <div 
                      className="method-progress-bar cash-bar"
                      style={{width: `${totalAmountCollected > 0 ? (cashAmount / totalAmountCollected * 100) : 0}%`}}
                    >
                      <span className="progress-percentage">
                        {totalAmountCollected > 0 ? Math.round(cashAmount / totalAmountCollected * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* UPI Progress Bar */}
                <div className="method-item">
                  <div className="method-header">
                    <div className="method-info">
                      <div className="method-icon upi-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="2" width="14" height="20" rx="2"/>
                          <path d="M12 18h.01"/>
                        </svg>
                      </div>
                      <span className="method-name">UPI</span>
                    </div>
                    <div className="method-amount">₹{upiAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="method-progress">
                    <div 
                      className="method-progress-bar upi-bar"
                      style={{width: `${totalAmountCollected > 0 ? (upiAmount / totalAmountCollected * 100) : 0}%`}}
                    >
                      <span className="progress-percentage">
                        {totalAmountCollected > 0 ? Math.round(upiAmount / totalAmountCollected * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Unpaid Participants Tab */}
        {activeTab === 'unpaid' && (
          <section className="unpaid-participants-section">
            <h2>💳 Proceed to Pay</h2>
            <p>Mark participants as paid to update their payment status</p>
            
            {/* Search Bar */}
            <div className="unpaid-search-bar">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="🔍 Search by ID, Name, Event, or Phone..."
                  value={unpaidSearchQuery}
                  onChange={(e) => {
                    setUnpaidSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(unpaidSearchQuery.length > 0)}
                  className="unpaid-search-input"
                />
                
                {/* Autocomplete Suggestions */}
                {showSuggestions && unpaidSearchQuery && (
                  <div className="search-suggestions">
                    {[...unpaidParticipants, ...paymentHistory]
                      .filter(participant => {
                        const query = unpaidSearchQuery.toLowerCase();
                        const participantId = getParticipantId(participant);
                        return (
                          (participantId || '').toLowerCase().includes(query) ||
                          (participant.participantId || '').toLowerCase().includes(query) ||
                          (participant.name || '').toLowerCase().includes(query) ||
                          (participant.event || '').toLowerCase().includes(query) ||
                          (participant.phoneNumber || '').includes(query)
                        );
                      })
                      .slice(0, 8) // Show max 8 suggestions
                      .map((participant, index) => {
                        const participantId = getParticipantId(participant);
                        return (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => {
                            setUnpaidSearchQuery(participantId || participant.participantId);
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="suggestion-id">{participantId || participant.participantId}</div>
                          <div className="suggestion-details">
                            <span className="suggestion-name">{participant.name}</span>
                            <span className="suggestion-separator">•</span>
                            <span className="suggestion-event">{participant.event}</span>
                          </div>
                          <div className="suggestion-amount">₹{(participant.remainingAmount || participant.paidAmount || 0).toLocaleString('en-IN')}</div>
                        </div>
                      );
                    })}
                    
                    {[...unpaidParticipants, ...paymentHistory].filter(participant => {
                      const query = unpaidSearchQuery.toLowerCase();
                      const participantId = getParticipantId(participant);
                      return (
                        (participantId || '').toLowerCase().includes(query) ||
                        (participant.participantId || '').toLowerCase().includes(query) ||
                        (participant.name || '').toLowerCase().includes(query) ||
                        (participant.event || '').toLowerCase().includes(query) ||
                        (participant.phoneNumber || '').includes(query)
                      );
                    }).length === 0 && (
                      <div className="no-suggestions">
                        No matching participants found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {unpaidSearchQuery && (
                <button
                  onClick={() => {
                    setUnpaidSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="clear-search-btn"
                >
                  ✕ Clear
                </button>
              )}
            </div>
            
            {loadingUnpaid ? (
              <div className="loading-message">
                <p>⏳ Loading participants...</p>
              </div>
            ) : filteredProceedToPayParticipants.length > 0 ? (
              <>
                <div className="unpaid-participants-list">
                  <div className="unpaid-header">
                    <span>User ID</span>
                    <span>Name</span>
                    <span>Type</span>
                    <span>Gender</span>
                    <span>Event</span>
                    <span>Phone</span>
                    <span>Amount Due</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {filteredProceedToPayParticipants
                    .map((participant, index) => {
                      const participantId = getParticipantId(participant);
                      return (
                  <div key={index} className="unpaid-row">
                    <span className="participant-id">{participantId}</span>
                    <span className="participant-name">
                      <div>{participant.name}</div>
                      <small>{participant.department} - {participant.year}</small>
                    </span>
                    <span className="participant-type-column">
                      <select
                        value={participantTypes[participantId] || 'visitor'}
                        onChange={(e) => setParticipantTypes(prev => ({
                          ...prev,
                          [participantId]: e.target.value
                        }))}
                        disabled={participant.paymentStatus === 'paid'}
                        className="participant-type-select"
                      >
                        <option value="visitor">👥 Visitor</option>
                        <option value="sports">⚽ Sports</option>
                        <option value="cultural">🎭 Cultural</option>
                        <option value="both">🌟 Both</option>
                      </select>
                    </span>
                    <span className="participant-gender-column">
                      <select
                        value={(participantGenders[participantId] || participant.gender || 'male').toLowerCase()}
                        onChange={(e) => setParticipantGenders(prev => ({
                          ...prev,
                          [participantId]: e.target.value
                        }))}
                        disabled={true}
                        className="participant-gender-select"
                      >
                        <option value="male">👨 Male</option>
                        <option value="female">👩 Female</option>
                      </select>
                    </span>
                    <span className="event-name">
                      {participant.eventNames && participant.eventNames.length > 0 ? (
                        <div className="event-registration-display">
                          <select className="event-dropdown" defaultValue={participant.eventNames[0]}>
                            {participant.eventNames.map((eventName: string, idx: number) => (
                              <option key={idx} value={eventName}>
                                {eventName}
                              </option>
                            ))}
                          </select>
                          <button 
                            className="edit-registration-btn"
                            onClick={() => openEventRegistrationModal(participant)}
                            title="Click to edit event registrations"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      ) : typeof participant.event === 'object' && participant.event?.title ? (
                        <div className="event-registration-display">
                          <span>{participant.event.title}</span>
                          <button 
                            className="edit-registration-btn"
                            onClick={() => openEventRegistrationModal(participant)}
                            title="Click to edit event registrations"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      ) : participant.event && participant.event !== 'No Events Registered' && !participant.event.includes('none') ? (
                        <div className="event-registration-display">
                          <span>{participant.event}</span>
                          <button 
                            className="edit-registration-btn"
                            onClick={() => openEventRegistrationModal(participant)}
                            title="Click to edit event registrations"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="add-registration-btn"
                          onClick={() => openEventRegistrationModal(participant)}
                          title="Click to register for events"
                        >
                          + Add Registration
                        </button>
                      )}
                    </span>
                    <span className="phone">{participant.phoneNumber}</span>
                    <span className="amount-due">
                      <div className="amount-display-container">
                        <div className="amount">
                          ₹{participant.paymentStatus === 'paid' ? '0' : calculateAmount(participantId, participant).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </span>
                    <span className={`status-badge ${participant.paymentStatus}`}>
                      {participant.paymentStatus === 'paid' ? '✅ Paid' : '❌ Unpaid'}
                    </span>
                    <span className="actions">
                      {participant.paymentStatus === 'paid' ? (
                        <div className="paid-status-indicator">
                          <span className="paid-checkmark">✓ Paid</span>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const amountToCharge = calculateAmount(participantId, participant);
                              markAsPaid(participantId, e.target.value, amountToCharge);
                              e.target.value = ''; // Reset select
                            }
                          }}
                          disabled={markingPaid === participantId}
                          className="payment-method-select"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            {markingPaid === participantId ? '⏳ Processing...' : '💰 Mark as Paid'}
                          </option>
                          <option value="cash">💵 Cash</option>
                          <option value="upi">📱 UPI</option>
                        </select>
                      )}
                    </span>
                  </div>
                      );
                    })}
                  </div>
                  
                  {/* Show message if no results found */}
                  {filteredProceedToPayParticipants.length === 0 && unpaidSearchQuery && (
                    <div className="no-search-results">
                      <p>No participants found matching "{unpaidSearchQuery}"</p>
                      <button onClick={() => setUnpaidSearchQuery('')} className="clear-search-btn">
                        Clear Search
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-unpaid">
                  <div className="success-state">
                    <h3>🎉 Great Job!</h3>
                    <p>All participants in your events have completed their payments!</p>
                    <p>There are no pending payments at this time.</p>
                  </div>
                </div>
              )}

            {/* Quick Stats */}
            {(() => {
              const allParticipants = [...unpaidParticipants, ...paymentHistory];
              const paidCount = allParticipants.filter(p => p.paymentStatus === 'paid').length;
              const totalPaid = allParticipants
                .filter(p => p.paymentStatus === 'paid')
                .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
              
              return allParticipants.length > 0 && (
                <div className="unpaid-stats">
                  <div className="stat-card">
                    <span className="stat-number">{paidCount}</span>
                    <span className="stat-label">Paid Participants</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </span>
                    <span className="stat-label">Total Collected</span>
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* Team Registration Tab */}
        {activeTab === 'team' && (
          <section className="team-registration-section">
            <div className="team-header">
              <div>
                <h2>Team Registration</h2>
                <p>Manage team registrations for participants</p>
              </div>
              <div className="team-action-buttons">
                <button
                  onClick={() => setShowTeamCreation(!showTeamCreation)}
                  className={`btn ${showTeamCreation ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {showTeamCreation ? 'View Existing Teams' : 'Create New Team'}
                </button>
              </div>
            </div>

            {showTeamCreation ? (
              <div className="team-creation-container">
                <TeamRegistrationNew 
                  onTeamCreated={() => {
                    console.log('Team created successfully');
                    setShowTeamCreation(false);
                    // Refresh the team registrations
                    fetchTeamRegistrations();
                  }}
                />
              </div>
            ) : (
              <div className="existing-teams-container">
                {/* Search Bar */}
                <div className="team-search-bar">
                  <input
                    type="text"
                    placeholder="Search by Name, Event, or Phone..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    className="team-search-input"
                  />
                  {teamSearchQuery && (
                    <button
                      onClick={() => setTeamSearchQuery('')}
                      className="team-clear-btn"
                    >
                      Clear
                    </button>
                  )}
                </div>
            
            {loadingTeams ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading team registrations...</p>
              </div>
            ) : teamRegistrations.length > 0 ? (
              <>
                <div className="team-table-container">
                  <table className="team-table">
                    <thead>
                      <tr>
                        <th style={{ width: '130px' }}>User ID</th>
                        <th style={{ width: '200px' }}>Name</th>
                        <th style={{ width: '160px' }}>Event</th>
                        <th style={{ width: '140px' }}>Phone</th>
                        <th style={{ width: '120px' }}>User Type</th>
                        <th style={{ width: '280px' }}>Team Members</th>
                        <th style={{ width: '130px' }}>Registration</th>
                        <th style={{ width: '150px' }}>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamRegistrations
                        .filter(team => {
                          if (!teamSearchQuery) return true;
                          const query = teamSearchQuery.toLowerCase();
                          return (
                            (team.userId || team.participantId || '').toLowerCase().includes(query) ||
                            (team.name || '').toLowerCase().includes(query) ||
                            (team.event || '').toLowerCase().includes(query) ||
                            (team.phoneNumber || '').includes(query)
                          );
                        })
                        .map((team, index) => {
                          const teamId = team.userId || team.participantId;
                          const teamMembersCount = team.teamMembers?.length || 0;
                          return (
                            <tr key={index}>
                              <td>
                                <span className="team-id">{teamId}</span>
                              </td>
                              <td>
                                <div className="team-name">{team.name}</div>
                                <div className="team-college">{team.college}</div>
                              </td>
                              <td>
                                <span>{team.event}</span>
                              </td>
                              <td>
                                <span className="team-phone">+91 {team.phoneNumber}</span>
                              </td>
                              <td>
                                <span className="user-type-badge">
                                  {team.userType}
                                </span>
                              </td>
                              <td className="team-members-cell">
                                {teamMembersCount > 0 ? (
                                  <div>
                                    <span className="team-member-count">
                                      {teamMembersCount} Member{teamMembersCount !== 1 ? 's' : ''}
                                    </span>
                                    {team.teamMembers && (
                                      <div className="team-member-list">
                                        {team.teamMembers.map((member: any, idx: number) => (
                                          <div key={idx} className="team-member-item">
                                            <span className="team-member-name">{member.name}</span>
                                            <span className="team-member-details">{member.department} - {member.year}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="no-team-members">No team members</span>
                                )}
                              </td>
                              <td>
                                <span className={`registration-status-badge ${team.registrationStatus}`}>
                                  {team.registrationStatus}
                                </span>
                              </td>
                              <td>
                                <div>
                                  <span className={`payment-status-badge ${team.paymentStatus}`}>
                                    {team.paymentStatus}
                                  </span>
                                  <div className="payment-amount">
                                    ₹{(team.paidAmount || 0).toLocaleString('en-IN')} / ₹{(team.paymentAmount || 0).toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                
                {/* No results message */}
                {teamRegistrations.filter(team => {
                  if (!teamSearchQuery) return true;
                  const query = teamSearchQuery.toLowerCase();
                  return (
                    (team.userId || team.participantId || '').toLowerCase().includes(query) ||
                    (team.name || '').toLowerCase().includes(query) ||
                    (team.event || '').toLowerCase().includes(query) ||
                    (team.phoneNumber || '').includes(query)
                  );
                }).length === 0 && teamSearchQuery && (
                  <div className="no-teams-found">
                    <p>No team registrations found matching "{teamSearchQuery}"</p>
                    <button 
                      onClick={() => setTeamSearchQuery('')} 
                      className="clear-search-btn"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
                
                {/* Statistics */}
                <div className="team-stats">
                  <div className="team-stat-card blue">
                    <div className="team-stat-label">Total Registrations</div>
                    <div className="team-stat-value">{teamRegistrations.length}</div>
                    <div className="team-stat-subtitle">Team registrations</div>
                  </div>
                  <div className="team-stat-card green">
                    <div className="team-stat-label">Total Members</div>
                    <div className="team-stat-value">
                      {teamRegistrations.reduce((sum, t) => sum + (t.teamMembers?.length || 0), 0)}
                    </div>
                    <div className="team-stat-subtitle">Registered members</div>
                  </div>
                  <div className="team-stat-card purple">
                    <div className="team-stat-label">Paid Teams</div>
                    <div className="team-stat-value">
                      {teamRegistrations.filter(t => t.paymentStatus === 'paid').length}
                    </div>
                    <div className="team-stat-subtitle">Completed payments</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-team-registrations">
                <h3>No Team Registrations</h3>
                <p>No participants with team registrations found at this time.</p>
                <p>Team registrations will appear here once participants register.</p>
              </div>
            )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Event Registration Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={closeEventRegistrationModal}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Register for Events</h2>
              <button className="modal-close-btn" onClick={closeEventRegistrationModal}>✕</button>
            </div>
            
            <div className="modal-body">
              {selectedParticipant && (
                <div className="participant-info">
                  <p><strong>Participant:</strong> {selectedParticipant.name}</p>
                  <p><strong>ID:</strong> {getParticipantId(selectedParticipant)}</p>
                  <p><strong>Type:</strong> {participantTypes[getParticipantId(selectedParticipant)] || selectedParticipant.userType || selectedParticipant.participationType || 'N/A'}</p>
                </div>
              )}

              {loadingEvents ? (
                <div className="loading-events">
                  <p>⏳ Loading events...</p>
                </div>
              ) : availableEvents.length > 0 ? (
                <div className="events-checklist">
                  <h3>Select Events to Register:</h3>
                  <div className="events-list">
                    {availableEvents.map((event) => (
                      <div key={event._id} className="event-item">
                        <label className="event-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedEventIds.includes(event._id)}
                            onChange={() => toggleEventSelection(event._id)}
                            className="event-checkbox"
                          />
                          <div className="event-details">
                            <div className="event-title">{event.title}</div>
                            <div className="event-meta">
                              <span className={`event-category ${event.category}`}>
                                {event.category}
                              </span>
                              <span className="event-date">
                                {new Date(event.eventDate).toLocaleDateString()}
                              </span>
                              <span className="event-venue">{event.venue}</span>
                            </div>
                            {event.availableSlots !== undefined && (
                              <div className="event-slots">
                                Available: {event.availableSlots} / {event.maxParticipants}
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-events">
                  <p>No events available for registration</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={closeEventRegistrationModal}
                disabled={registeringEvents}
              >
                Cancel
              </button>
              <button 
                className="btn-register" 
                onClick={registerForEvents}
                disabled={registeringEvents || selectedEventIds.length === 0}
              >
                {registeringEvents ? '⏳ Registering...' : `Register (${selectedEventIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;