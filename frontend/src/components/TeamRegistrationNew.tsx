import React, { useState, useEffect, useRef } from 'react';
import './TeamRegistrationNew.css';

interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  venue: string;
  maxParticipants: number;
  currentParticipants: number;
}

interface PaymentVerification {
  mhid: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  rollNumber: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  isPaid: boolean;
}

interface TeamMember {
  mhid: string;
  name: string;
  email: string;
  phone: string;
  paymentStatus: string;
}

interface College {
  name: string;
  state: string;
  district: string;
}

interface TableRow {
  sno: number;
  mhid: string;
  name: string;
  college: string;
  rollNumber: string;
  phone: string;
  isLeader: boolean;
  isVerified: boolean;
  isValid: boolean;
  isVerifying: boolean;
  errorMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CreatedTeam {
  _id?: string;
  teamId?: string;
  teamName: string;
  teamLeader: {
    participantId: string;
    name: string;
  };
  teamMembers: TeamMember[];
}

interface TeamRegistrationNewProps {
  onTeamCreated?: () => void;
}

const TeamRegistrationNew: React.FC<TeamRegistrationNewProps> = ({ onTeamCreated }) => {
  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryEvents, setCategoryEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [teamLeaderName, setTeamLeaderName] = useState('');
  const [teamLeaderMhid, setTeamLeaderMhid] = useState('');
  const [teamLeaderDetails, setTeamLeaderDetails] = useState<PaymentVerification | null>(null);
  const [memberMhidInput, setMemberMhidInput] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [verifyingLeader, setVerifyingLeader] = useState(false);
  const [verifyingMember, setVerifyingMember] = useState(false);
  const [verifiedMember, setVerifiedMember] = useState<PaymentVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mhidSuggestions, setMhidSuggestions] = useState<PaymentVerification[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchingMhids, setSearchingMhids] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef('');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [teamName, setTeamName] = useState('');

  // Fetch all teams and colleges on component mount
  useEffect(() => {
    fetchAllTeams();
    fetchColleges();
  }, []);

  // Initialize table when event is selected
  useEffect(() => {
    if (selectedEvent && currentStep === 3 && tableRows.length === 0) {
      initializeTableRows(selectedEvent.maxParticipants);
    }
  }, [selectedEvent, currentStep, tableRows.length]);

  const fetchAllTeams = async () => {
    try {
      setLoadingTeams(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/teams/all-teams', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const teams = await response.json();
        setAllTeams(teams);
        console.log('✅ Loaded teams:', teams.length);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchColleges = async () => {
    try {
      setLoadingColleges(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/teams/colleges', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const collegesData = await response.json();
        setColleges(collegesData);
        console.log('✅ Loaded colleges:', collegesData.length);
      }
    } catch (err) {
      console.error('Error fetching colleges:', err);
    } finally {
      setLoadingColleges(false);
    }
  };

  // Search MHIDs for autocomplete (debounced to avoid 429s)
  const searchMhids = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 4) {
      setMhidSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      // Avoid duplicate network calls for same query
      if (lastSearchRef.current === query) return;
      lastSearchRef.current = query;

      try {
        setSearchingMhids(true);
        const token = localStorage.getItem('authToken');
        const collegeParam = selectedCollege ? `&college=${encodeURIComponent(selectedCollege)}` : '';
        const response = await fetch(`/api/teams/search-participants?query=${query}${collegeParam}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const participants = await response.json();
          setMhidSuggestions(participants);
          setShowSuggestions(true);
        } else {
          setMhidSuggestions([]);
        }
      } catch (err) {
        console.error('Error searching MHIDs:', err);
        setMhidSuggestions([]);
      } finally {
        setSearchingMhids(false);
      }
    }, 300);
  };

  // Fetch events for selected category from registration.json (Team events only)
  const fetchCategoryEvents = async (category: string) => {
    try {
      setLoading(true);
      setError('');

      // Fetch registration.json from public folder
      const response = await fetch('/registration.json');

      if (!response.ok) {
        throw new Error('Failed to load registration data');
      }

      const registrationData = await response.json();
      const events: Event[] = [];

      // Handle Sports category
      if (category.toLowerCase() === 'sports') {
        const sportsEvents = registrationData.Sports || [];
        let currentCategory = '';

        for (const item of sportsEvents) {
          if (item.Category) {
            currentCategory = item.Category;
          }

          // Only include team events (categories containing "Team")
          const isTeamCategory = currentCategory.toLowerCase().includes('team');

          if (isTeamCategory && item.Event) {
            // Extract team size from event name (e.g., "Cricket Championship (13+2)*" = 15 total)
            let maxParticipants = 15; // default
            const match = item.Event.match(/\((\d+)\+(\d+)\)/);
            if (match) {
              const playing = parseInt(match[1]);
              const substitutes = parseInt(match[2]);
              maxParticipants = playing + substitutes;
            }

            events.push({
              _id: `${currentCategory}-${item.Event}`.replace(/\s+/g, '-'),
              title: item.Event,
              description: item.Event,
              category: currentCategory,
              eventDate: '',
              venue: '',
              maxParticipants: maxParticipants,
              currentParticipants: 0
            });
          }
        }
      }

      // Handle Culturals category
      if (category.toLowerCase() === 'cultural' || category.toLowerCase() === 'culturals') {
        const culturalEvents = registrationData.Culturals || [];
        let currentSubCategory = '';

        for (const item of culturalEvents) {
          if (!item) continue; // Skip null entries

          // Track sub-category (stored in "5" key)
          if (item['5']) {
            currentSubCategory = item['5'];
          }

          // Event name is stored in "Prize money for Performing arts, Visual arts, Fashion" key
          const eventName = item['Prize money for Performing arts, Visual arts, Fashion'];
          const participantCount = item['Column4'];

          // Only include team events (more than 1 participant)
          if (eventName && typeof participantCount === 'number' && participantCount > 1) {
            events.push({
              _id: `Cultural-${currentSubCategory}-${eventName}`.replace(/\s+/g, '-'),
              title: eventName,
              description: `${currentSubCategory} - ${eventName}`,
              category: currentSubCategory || 'Cultural',
              eventDate: '',
              venue: '',
              maxParticipants: participantCount,
              currentParticipants: 0
            });
          }
        }
      }

      setCategoryEvents(events);

      if (events.length === 0) {
        setError(`No ${category} team events available at the moment.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load events.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyTeamLeader = async () => {
    if (!teamLeaderMhid || teamLeaderMhid.length !== 10) {
      setError('Please enter a valid MHID (10 characters: MH26000001)');
      return;
    }

    if (!teamLeaderMhid.toUpperCase().startsWith('MH')) {
      setError('MHID must start with MH (e.g., MH26000001)');
      return;
    }

    try {
      setVerifyingLeader(true);
      setError('');
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/teams/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mhid: teamLeaderMhid.toUpperCase() })
      });

      const data = await parseResponseSafe(response);

      if (!response.ok) {
        throw new Error((data as any).error || (data as any).message || 'Verification failed');
      }

      const verified = data as PaymentVerification;
      setTeamLeaderDetails(verified);

      if (!verified.isPaid) {
        setError(`Team leader payment status: ${verified.paymentStatus}. Only paid participants can be team leader.`);
      } else {
        setTeamLeaderName(verified.name);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify team leader');
      setTeamLeaderDetails(null);
    } finally {
      setVerifyingLeader(false);
    }
  };

  const verifyMember = async () => {
    if (!memberMhidInput || memberMhidInput.length !== 10) {
      setError('Please enter a valid MHID (10 characters: MH26000001)');
      return;
    }

    if (!memberMhidInput.toUpperCase().startsWith('MH')) {
      setError('MHID must start with MH (e.g., MH26000001)');
      return;
    }

    // Check if already added
    if (memberMhidInput.toUpperCase() === teamLeaderMhid.toUpperCase()) {
      setError('Team leader is already added');
      return;
    }

    if (teamMembers.some(m => m.mhid.toUpperCase() === memberMhidInput.toUpperCase())) {
      setError('This participant is already added to the team');
      return;
    }

    try {
      setVerifyingMember(true);
      setError('');
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/teams/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mhid: memberMhidInput.toUpperCase() })
      });

      const data = await parseResponseSafe(response);

      if (!response.ok) {
        throw new Error((data as any).error || (data as any).message || 'Verification failed');
      }

      const verified = data as PaymentVerification;
      setVerifiedMember(verified);

      if (!verified.isPaid) {
        setError(`Payment status: ${verified.paymentStatus}. Only paid participants can join teams.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify participant');
      setVerifiedMember(null);
    } finally {
      setVerifyingMember(false);
    }
  };

  const addMember = () => {
    if (!verifiedMember || !verifiedMember.isPaid) {
      setError('Please verify a paid participant first');
      return;
    }

    if (selectedEvent && teamMembers.length >= selectedEvent.maxParticipants - 1) {
      setError(`Maximum team size is ${selectedEvent.maxParticipants} (including leader)`);
      return;
    }

    const newMember: TeamMember = {
      mhid: verifiedMember.mhid,
      name: verifiedMember.name,
      email: verifiedMember.email,
      phone: verifiedMember.phone,
      paymentStatus: verifiedMember.paymentStatus
    };

    setTeamMembers([...teamMembers, newMember]);
    setMemberMhidInput('');
    setVerifiedMember(null);
    setSuccess(`${newMember.name} added successfully!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const removeMember = (mhid: string) => {
    setTeamMembers(teamMembers.filter(m => m.mhid !== mhid));
  };

  // Safely parse JSON responses; fallback to text for non-JSON (e.g., 429 Too Many Requests)
  const parseResponseSafe = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch (err) {
        console.warn('Failed to parse JSON, returning raw text');
        return { message: text };
      }
    }
    return { message: text };
  };

  // Initialize table rows when event is selected
  const initializeTableRows = (maxParticipants: number) => {
    const rows: TableRow[] = [];
    for (let i = 0; i < maxParticipants; i++) {
      rows.push({
        sno: i + 1,
        mhid: '',
        name: '',
        college: '',
        rollNumber: '',
        phone: '',
        isLeader: i === 0,
        isVerified: false,
        isValid: false,
        isVerifying: false,
        errorMessage: ''
      });
    }
    setTableRows(rows);
  };

  // Update a specific table row
  const updateTableRow = (rowIndex: number, updates: Partial<TableRow>) => {
    setTableRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = { ...newRows[rowIndex], ...updates };
      return newRows;
    });
  };

  // Handle MHID change
  const handleMhidChange = (rowIndex: number, value: string) => {
    updateTableRow(rowIndex, { mhid: value });
  };

  // Handler for MHID input with Enter key
  const handleMhidInput = async (rowIndex: number, mhid: string, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (!mhid || mhid.length !== 10) {
      updateTableRow(rowIndex, { errorMessage: 'Invalid MHID format (10 characters required)' });
      return;
    }

    updateTableRow(rowIndex, { isVerifying: true, errorMessage: '' });

    try {
      const token = localStorage.getItem('authToken');
      // Using direct URL to bypass potential proxy issues
      const response = await fetch('http://localhost:5005/api/teams/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mhid: mhid.toUpperCase() })
      });

      const data = await response.json();

      console.log('✅ Verification successful for row', rowIndex, ':');
      console.log('  - Full API response:', data);
      console.log('  - College:', data.college);
      console.log('  - RollNumber:', data.rollNumber);
      console.log('  - Phone:', data.phone);

      // UPDATE DEBUG DISPLAY - ALWAYS RUN THIS
      const debugEl = document.getElementById('debug-api-response');
      if (debugEl) {
        debugEl.innerText = JSON.stringify(data, null, 2);
      }

      if (!response.ok) {
        updateTableRow(rowIndex, {
          isVerifying: false,
          isValid: false,
          errorMessage: data.error || 'Verification failed'
        });
        return;
      }

      if (!data.isPaid) {
        updateTableRow(rowIndex, {
          isVerifying: false,
          isValid: false,
          errorMessage: `Payment status: ${data.paymentStatus}. Only paid participants allowed.`,
          // Ensure these fields are set even if unpaid
          mhid: data.mhid,
          name: data.name,
          college: data.college || '',
          rollNumber: data.rollNumber || '',
          phone: data.phone || ''
        });
        return;
      }
      console.log('  - RollNumber:', data.rollNumber);
      console.log('  - Phone:', data.phone);

      // Check if participant's college matches the selected college
      if (data.college !== selectedCollege) {
        const errorMsg = `❌ College Mismatch!\n\nThis participant is from "${data.college}"\nbut the team is for "${selectedCollege}".\n\nAll team members must be from the same college.`;
        alert(errorMsg);

        updateTableRow(rowIndex, {
          isVerifying: false,
          isValid: false,
          errorMessage: `College mismatch! Expected: ${selectedCollege}, Got: ${data.college}`,
          mhid: '',  // Clear the MHID so they can try again
          name: '',
          college: '',
          rollNumber: '',
          phone: ''
        });
        return;
      }

      // Check if participant has registered for this specific event
      if (!selectedEvent) {
        updateTableRow(rowIndex, {
          isVerifying: false,
          isValid: false,
          errorMessage: 'Event not selected'
        });
        return;
      }


      // More flexible event matching - check by ID or name (case-insensitive, partial match)
      console.log('🎯 Event Matching Debug:');
      console.log('  - Selected Event:', selectedEvent.title);
      console.log('  - Registered Events:', data.registeredEvents);

      const selectedEventTitle = selectedEvent.title.toLowerCase().trim();
      const hasRegisteredForEvent = data.registeredEvents?.some((event: any) => {
        console.log(`\n  📍 Checking event:`, event);
        console.log(`     - eventName: "${event.eventName}"`);
        console.log(`     - eventId: ${event.eventId || 'MISSING'}`);

        // Check by event ID (exact match)
        if (event.eventId && selectedEvent._id && event.eventId === selectedEvent._id) {
          console.log('     ✅ MATCH by eventId!');
          return true;
        }

        // Check by event name (case-insensitive, partial match)
        if (event.eventName) {
          const registeredEventName = event.eventName.toLowerCase().trim();
          console.log(`     - Comparing: "${selectedEventTitle}" vs "${registeredEventName}"`);

          const exactMatch = registeredEventName === selectedEventTitle;
          const includes1 = registeredEventName.includes(selectedEventTitle);
          const includes2 = selectedEventTitle.includes(registeredEventName);

          console.log(`       Exact: ${exactMatch}, Includes1: ${includes1}, Includes2: ${includes2}`);

          const matches = exactMatch || includes1 || includes2;
          if (matches) {
            console.log('     ✅ MATCH by eventName!');
          }
          return matches;
        }

        return false;
      });

      if (!hasRegisteredForEvent) {
        const errorMsg = `❌ Event Registration Required!\n\nThis participant has NOT registered for "${selectedEvent.title}".\n\nOnly participants who have registered for this specific event can join the team.`;
        alert(errorMsg);

        updateTableRow(rowIndex, {
          isVerifying: false,
          isValid: false,
          errorMessage: `Not registered for ${selectedEvent.title}`,
          mhid: '',  // Clear the MHID so they can try again
          name: '',
          college: '',
          rollNumber: '',
          phone: ''
        });
        return;
      }

      const rowData = {
        mhid: data.mhid,
        name: data.name,
        college: data.college || '',
        rollNumber: data.rollNumber || '',
        phone: data.phone,
        isVerifying: false,
        isVerified: true,
        isValid: true,
        errorMessage: ''
      };

      console.log('  - Setting row data:', rowData);
      updateTableRow(rowIndex, rowData);

      const nextInput = document.querySelector(`input[data-row="${rowIndex + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    } catch (error) {
      updateTableRow(rowIndex, {
        isVerifying: false,
        isValid: false,
        errorMessage: 'Network error. Please try again.'
      });
    }
  };

  const handleSubmitTeam = async () => {
    // Validate: Event and College must be selected
    if (!selectedEvent || !selectedCollege) {
      setError('Please select an event and college');
      return;
    }

    // Validate: Team name is required
    if (!teamName || !teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    // Validate: At least one team member must be verified in the table
    const verifiedRows = tableRows.filter(row => row.isVerified && row.isValid && row.mhid);

    if (verifiedRows.length === 0) {
      setError('Please add at least one verified team member');
      return;
    }

    // Find the team leader (first row)
    const teamLeaderRow = verifiedRows[0];
    if (!teamLeaderRow) {
      setError('Team leader (first member) must be verified');
      return;
    }


    // Check for duplicate MHIDs in the team
    const allMhids = verifiedRows.map(row => row.mhid);
    const uniqueMhids = new Set(allMhids.map(id => id.toUpperCase()));

    if (uniqueMhids.size !== allMhids.length) {
      setError('Duplicate MHID found! Each participant can only be added once to the team.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      console.log('📝 Selected Event Details:', {
        id: selectedEvent._id,
        title: selectedEvent.title,
        category: selectedEvent.category,
        venue: selectedEvent.venue
      });
      console.log('📤 Sending team data to backend:', {
        collegeName: selectedCollege,
        eventId: selectedEvent._id,
        eventName: selectedEvent.title
      });


      const teamData = {
        collegeName: selectedCollege,
        eventId: selectedEvent._id,
        eventName: selectedEvent.title,
        customTeamName: teamName.trim(), // Always send team name (now required)
        teamLeaderData: {
          participantId: teamLeaderRow.mhid,
          name: teamLeaderRow.name,
          email: `${teamLeaderRow.mhid.toLowerCase()}@participant.com`, // Placeholder email
          phoneNumber: teamLeaderRow.phone
        },
        teamMembers: verifiedRows.slice(1).map(row => ({
          participantId: row.mhid,
          name: row.name,
          email: `${row.mhid.toLowerCase()}@participant.com`, // Placeholder email
          phoneNumber: row.phone,
          paymentStatus: 'paid' // Assuming all verified members are paid
        }))
      };

      const response = await fetch('/api/teams/create-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teamData)
      });

      const result = await parseResponseSafe(response);

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create team');
      }

      console.log('✅ Team created successfully:', result);
      console.log('✅ Response team object:', result.team);
      console.log('✅ Team ID:', result.team?.teamId);
      console.log('✅ Team Name:', result.team?.teamName);
      console.log('✅ Event Name in response:', result.team?.eventName);
      console.log('✅ Event ID in response:', result.team?.eventId);

      if (!result.team) {
        alert('⚠️ Error: No team data in response!');
        console.error('Response is missing team data:', result);
        return;
      }

      const team = result.team;

      // Prepare member details
      const membersList = team.teamMembers.map((m: any, i: number) =>
        `${i + 2}. ${m.name} (${m.participantId})`
      ).join('\n');

      // Show alert with all team details
      alert(
        `🎉 Team Registered Successfully!\n\n` +
        `Team ID: ${team.teamId}\n` +
        `Team Name: ${team.teamName}\n` +
        `Event Name: ${team.eventName}\n\n` +
        `Team Leader:\n👑 ${team.teamLeader.name} (${team.teamLeader.participantId})\n\n` +
        `Team Members:\n${membersList}\n\n` +
        `Total Members: ${1 + team.teamMembers.length}\n` +
        `Total Amount: ₹${team.totalAmount}\n` +
        `Created At: ${new Date(team.createdAt || Date.now()).toLocaleString()}`
      );

      // Refresh teams list
      fetchAllTeams();

      // Reset form
      setCurrentStep(1);
      setSelectedCategory('');
      setSelectedEvent(null);
      setSelectedCollege('');
      setCollegeSearchQuery('');
      setTableRows([]);
      setTeamName('');
      setError('');

      if (onTeamCreated) {
        onTeamCreated();
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to register team');
      alert('❌ Error: ' + (err.message || 'Failed to register team'));
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getCategoryBadgeClass = (category: string) => {
    // Handle both 'culturals' and 'cultural' formats
    if (category === 'culturals' || category === 'cultural') {
      return 'event-category-badge cultural';
    }
    return `event-category-badge ${category.toLowerCase()}`;
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'unpaid':
        return '✗';
      case 'pending':
        return '⏳';
      default:
        return '?';
    }
  };



  return (
    <div className="team-registration-container">
      <div className="team-registration-wrapper">
        {/* Back to Dashboard Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={onTeamCreated}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="team-registration-header">
          <h1>🎭 Team Registration 🎭</h1>
          <p>Join the National Mahotsav - Register Your Team</p>
        </div>

        {/* All Teams Display - HIDDEN */}
        <div style={{
          display: 'none',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '30px',
          color: '#f4d03f',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '1.8rem', color: '#f4d03f', fontWeight: '700', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>📋 All Registered Teams ({allTeams.length})</h2>

          {/* Search Bar */}
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="🔍 Search by Team Name, Team ID, Event, or Leader MHID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                fontSize: '1rem',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.9)',
                color: '#333',
                outline: 'none'
              }}
            />
          </div>

          {loadingTeams ? (
            <p>Loading teams...</p>
          ) : (() => {
            const filteredTeams = allTeams.filter(team => {
              const query = searchQuery.toLowerCase();
              return (
                team.teamName?.toLowerCase().includes(query) ||
                team.teamId?.toLowerCase().includes(query) ||
                team.eventName?.toLowerCase().includes(query) ||
                team.teamLeader?.participantId?.toLowerCase().includes(query) ||
                team.teamLeader?.name?.toLowerCase().includes(query) ||
                team.teamMembers?.some((member: any) =>
                  member.participantId?.toLowerCase().includes(query) ||
                  member.name?.toLowerCase().includes(query)
                )
              );
            });

            return filteredTeams.length === 0 ? (
              <p style={{ color: '#f9e79f', fontSize: '1.1rem', fontWeight: '500' }}>{searchQuery ? 'No teams found matching your search.' : 'No teams registered yet. Be the first!'}</p>
            ) : (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                {filteredTeams.map((team, index) => (
                  <div key={team._id || index} style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '10px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '1.2rem' }}>🎫 {team.teamId}</strong>
                      <span style={{ background: 'rgba(255,255,255,0.3)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        {team.status || 'forming'}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
                      <strong>Team:</strong> {team.teamName}
                    </div>
                    <div style={{ fontSize: '0.95rem', marginBottom: '8px', opacity: 0.9 }}>
                      <strong>Event:</strong> {team.eventName}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                      <strong>Leader:</strong> 👑 {team.teamLeader?.name} ({team.teamLeader?.participantId})
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                      <strong>Members:</strong> {team.teamMembers?.length || 0} | <strong>Total:</strong> {1 + (team.teamMembers?.length || 0)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className="progress-step">
            <div className={`progress-circle ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className={`progress-label ${currentStep === 1 ? 'active' : ''}`}>Select Event</span>
          </div>
          <span className="progress-arrow">→</span>
          <div className="progress-step">
            <div className={`progress-circle ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span className={`progress-label ${currentStep === 2 ? 'active' : ''}`}>Team Details</span>
          </div>
          <span className="progress-arrow">→</span>
          <div className="progress-step">
            <div className={`progress-circle ${currentStep >= 3 ? 'active' : ''}`}>3</div>
            <span className={`progress-label ${currentStep === 3 ? 'active' : ''}`}>Add Members</span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert error">
            <span className="status-icon">⚠️</span>
            <div style={{ flex: 1 }}>{error}</div>
            <button
              onClick={() => setError('')}
              style={{
                background: 'white',
                color: '#721c24',
                border: '1px solid #721c24',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
                marginLeft: '10px'
              }}
            >
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="alert success">
            <span className="status-icon">✓</span>
            {success}
          </div>
        )}

        {/* Main Card */}
        <div className="team-registration-card">
          {/* Step 1: Category Selection */}
          {currentStep === 1 && (
            <div className="registration-step">
              <div className="step-header">
                <div className="step-number">1</div>
                <div className="step-title">
                  <h2>Select Event Category</h2>
                  <p>Choose a category to view available events</p>
                </div>
              </div>

              <div className="event-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <label className="event-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                  <input
                    type="radio"
                    name="category"
                    value="sports"
                    checked={selectedCategory === 'sports'}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      fetchCategoryEvents(e.target.value);
                      setCurrentStep(2);
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚽</div>
                  <h3>Sports</h3>
                  <p>Athletic competitions and tournaments</p>
                </label>

                <label className="event-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                  <input
                    type="radio"
                    name="category"
                    value="cultural"
                    checked={selectedCategory === 'cultural'}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      fetchCategoryEvents(e.target.value);
                      setCurrentStep(2);
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎭</div>
                  <h3>Cultural</h3>
                  <p>Dance, music, and arts events</p>
                </label>

                <label className="event-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                  <input
                    type="radio"
                    name="category"
                    value="para"
                    checked={selectedCategory === 'para'}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      fetchCategoryEvents(e.target.value);
                      setCurrentStep(2);
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎪</div>
                  <h3>Para</h3>
                  <p>Special events and activities</p>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Event Selection */}
          {currentStep === 2 && (
            <div className="registration-step">
              <div className="step-header">
                <div className="step-number">2</div>
                <div className="step-title">
                  <h2>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Events</h2>
                  <p>Select an event for team registration</p>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner" style={{
                    width: '50px',
                    height: '50px',
                    borderWidth: '5px',
                    margin: '0 auto'
                  }}></div>
                  <p style={{ marginTop: '20px', color: '#666' }}>Loading {selectedCategory} events...</p>
                </div>
              ) : categoryEvents.length === 0 ? (
                <div className="alert info">
                  <span>ℹ️</span>
                  <div>No {selectedCategory} events available at the moment.</div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  {categoryEvents.map((event: Event) => (
                    <button
                      key={event._id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setCurrentStep(3);
                      }}
                      style={{
                        background: selectedEvent?._id === event._id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                        color: selectedEvent?._id === event._id ? 'white' : '#333',
                        border: selectedEvent?._id === event._id ? '2px solid #667eea' : '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        boxShadow: selectedEvent?._id === event._id ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedEvent?._id !== event._id) {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedEvent?._id !== event._id) {
                          e.currentTarget.style.borderColor = '#ddd';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }
                      }}
                    >
                      <div style={{
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        marginBottom: '4px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {event.category}
                      </div>
                      <div style={{ fontWeight: '600', marginBottom: '6px', lineHeight: '1.2' }}>
                        {event.title}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        opacity: 0.7,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>👥 Max: {event.maxParticipants}</span>
                        {selectedEvent?._id === event._id && (
                          <span style={{ fontSize: '1rem' }}>✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="navigation-buttons">
                <button
                  className="nav-btn back-btn"
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedCategory('');
                    setCategoryEvents([]);
                  }}
                >
                  ← Back to Categories
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Team Registration Form */}
          {currentStep === 3 && selectedEvent && (
            <div className="registration-step">
              <div className="step-header">
                <div className="step-number">3</div>
                <div className="step-title">
                  <h2>Team Registration Form</h2>
                  <p>Enter team details and add members for {selectedEvent.title}</p>
                </div>
              </div>

              <div className="alert info" style={{ display: 'none' }}>
                <span>📌</span>
                <div>
                  <strong>Event:</strong> {selectedEvent.title} | <strong>Max Team Size:</strong> {selectedEvent.maxParticipants}
                </div>
              </div>

              <div className="team-form">
                {/* College Name */}
                <div className="form-group">
                  <label>College Name *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search and select your college..."
                      value={collegeSearchQuery}
                      onChange={(e) => setCollegeSearchQuery(e.target.value)}
                      onFocus={() => setCollegeSearchQuery('')}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '1rem',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                    {collegeSearchQuery && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        background: 'white',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        marginTop: '4px',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}>
                        {loadingColleges ? (
                          <div style={{ padding: '12px', textAlign: 'center' }}>Loading colleges...</div>
                        ) : (
                          colleges
                            .filter(c => c.name.toLowerCase().includes(collegeSearchQuery.toLowerCase()))
                            .slice(0, 50)
                            .map((college, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setSelectedCollege(college.name);
                                  setCollegeSearchQuery(college.name);
                                }}
                                style={{
                                  padding: '10px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ fontWeight: '600' }}>{college.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                  {college.district}, {college.state}
                                </div>
                              </div>
                            ))
                        )}
                        {!loadingColleges && colleges.filter(c => c.name.toLowerCase().includes(collegeSearchQuery.toLowerCase())).length === 0 && (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                            No colleges found
                          </div>
                        )}
                      </div>
                    )}
                    {selectedCollege && !collegeSearchQuery && (
                      <div style={{
                        marginTop: '8px',
                        padding: '10px',
                        background: '#e8f5e9',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: '600', color: '#2e7d32' }}>✓ {selectedCollege}</span>
                        <button
                          onClick={() => {
                            setSelectedCollege('');
                            setCollegeSearchQuery('');
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#d32f2f',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0 8px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Name Field */}
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label>Team Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your team name (e.g., Thunder Strikers, Warriors, etc.)"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '1rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      outline: 'none',
                      background: 'white',
                      color: '#333'
                    }}
                  />
                  <small style={{ color: '#ffffff', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Choose a unique name for your team
                  </small>
                </div>



                {/* Team Members Table */}
                <div style={{ marginTop: '30px', overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    background: 'white',
                    border: '5px solid black',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <th style={{ padding: '15px 10px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #ddd', width: '60px' }}>S.No</th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #ddd', width: '140px' }}>MHID *</th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #ddd' }}>Name</th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #ddd' }}>College</th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #ddd', width: '120px' }}>Reg. Number</th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #ddd', width: '120px' }}>Mobile</th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #ddd', width: '80px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, index) => (
                        <tr key={index} style={{
                          background: row.isLeader ? '#fff9e6' : (row.isValid ? '#e8f5e9' : (row.errorMessage ? '#ffebee' : 'white')),
                          borderLeft: row.isLeader ? '4px solid #f4d03f' : 'none'
                        }}>
                          <td style={{ padding: '12px 10px', fontSize: '0.9rem', fontWeight: row.isLeader ? '600' : 'normal', color: '#000000', border: '1px solid #ddd' }}>
                            {row.isLeader && <span style={{ marginRight: '5px' }}>👑</span>}
                            {row.sno}
                            {row.isLeader && <div style={{ fontSize: '0.75rem', color: '#f4d03f', marginTop: '2px' }}>Team Leader</div>}
                          </td>
                          <td style={{ padding: '12px 10px', border: '1px solid #ddd' }}>
                            <input
                              type="text"
                              value={row.mhid}
                              onChange={(e) => handleMhidChange(index, e.target.value.toUpperCase())}
                              onKeyDown={(e) => handleMhidInput(index, row.mhid, e)}
                              data-row={index}
                              placeholder="MH26000001"
                              maxLength={10}
                              disabled={row.isVerifying}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: row.errorMessage ? '2px solid #f44336' : '2px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                outline: 'none',
                                background: row.isValid ? '#f5f5f5' : 'white'
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.9rem', color: row.name ? '#000000' : '#999', border: '1px solid #ddd' }}>
                            {row.isVerifying ? 'Verifying...' : (row.name || '-')}
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: '#333', border: '1px solid #ddd' }}>
                            {row.college || '-'}
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: '#333', border: '1px solid #ddd' }}>
                            {row.rollNumber || '-'}
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: '#333', border: '1px solid #ddd' }}>
                            {row.phone || '-'}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', border: '1px solid #ddd' }}>
                            {row.isVerifying && <span style={{ fontSize: '1.2rem' }}>⏳</span>}
                            {row.isValid && <span style={{ fontSize: '1.2rem', color: '#4caf50' }}>✓</span>}
                            {row.errorMessage && (
                              <span
                                style={{ fontSize: '1.2rem', color: '#f44336', cursor: 'help' }}
                                title={row.errorMessage}
                              >
                                ✗
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Error Messages */}
                  {tableRows.some(row => row.errorMessage) && (
                    <div style={{ marginTop: '15px', padding: '12px', background: '#ffebee', borderRadius: '6px', border: '1px solid #f44336' }}>
                      <strong style={{ color: '#d32f2f', display: 'block', marginBottom: '8px' }}>⚠️ Errors:</strong>
                      {tableRows.map((row, index) => row.errorMessage && (
                        <div key={index} style={{ fontSize: '0.9rem', color: '#d32f2f', marginBottom: '4px' }}>
                          • Row {row.sno}: {row.errorMessage}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        // Get required members count (total - substitutes)
                        const requiredCount = selectedEvent.maxParticipants;
                        const validMembers = tableRows.filter(row => row.isValid && row.mhid).length;

                        if (validMembers < requiredCount) {
                          alert(`⚠️ Incomplete Team!\n\nRequired members: ${requiredCount}\nCurrent valid members: ${validMembers}\n\nPlease add all required team members before submitting.\n(Substitutes are optional)`);
                          return;
                        }

                        // Call submit function
                        handleSubmitTeam();
                      }}
                      disabled={(() => {
                        const requiredCount = selectedEvent.maxParticipants;
                        const validMembers = tableRows.filter(row => row.isValid && row.mhid).length;
                        return validMembers < requiredCount || loading;
                      })()}
                      style={{
                        padding: '15px 40px',
                        background: (() => {
                          const requiredCount = selectedEvent.maxParticipants;
                          const validMembers = tableRows.filter(row => row.isValid && row.mhid).length;
                          return validMembers < requiredCount || loading
                            ? '#ccc'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                        })(),
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: (() => {
                          const requiredCount = selectedEvent.maxParticipants;
                          const validMembers = tableRows.filter(row => row.isValid && row.mhid).length;
                          return validMembers < requiredCount || loading ? 'not-allowed' : 'pointer';
                        })(),
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        const requiredCount = selectedEvent.maxParticipants;
                        const validMembers = tableRows.filter(row => row.isValid && row.mhid).length;
                        if (validMembers >= requiredCount && !loading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      {loading ? 'Submitting...' : 'Register Team 🎉'}
                    </button>
                    <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#ffffff' }}>
                      {(() => {
                        const requiredCount = selectedEvent.maxParticipants;
                        const validMembers = tableRows.filter(row => row.isValid && row.mhid).length;
                        return `Valid Members: ${validMembers} / ${requiredCount} required`;
                      })()}
                    </div>
                  </div>

                </div>

              </div>






              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'none' }}>
                <h3 style={{ marginTop: 0 }}>Team Leader</h3>

                <div className="form-group">
                  <label>Team Leader Name *</label>
                  <input
                    type="text"
                    value={teamLeaderName}
                    onChange={(e) => setTeamLeaderName(e.target.value)}
                    placeholder="Enter leader name"
                  />
                </div>

                <div className="form-group">
                  <label>Team Leader MHID *</label>
                  <div className="mhid-input-group" style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={teamLeaderMhid}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        if (value.length <= 10) {
                          setTeamLeaderMhid(value);
                          if (value.length >= 4) {
                            searchMhids(value);
                            setShowSuggestions(true);
                          } else {
                            setShowSuggestions(false);
                          }
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && teamLeaderMhid.length === 10) {
                          verifyTeamLeader();
                          setShowSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        if (teamLeaderMhid.length >= 4 && mhidSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      placeholder="MH26000001"
                      maxLength={10}
                    />
                    <button
                      onClick={verifyTeamLeader}
                      disabled={verifyingLeader || teamLeaderMhid.length !== 10}
                      className="verify-btn"
                    >
                      {verifyingLeader ? 'Verifying...' : 'Verify'}
                    </button>

                    {/* MHID Suggestions Dropdown */}
                    {showSuggestions && mhidSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        marginTop: '5px'
                      }}>
                        {mhidSuggestions.map((participant) => (
                          <div
                            key={participant.mhid}
                            onClick={() => {
                              setTeamLeaderMhid(participant.mhid);
                              setShowSuggestions(false);
                              // Auto-verify after selection
                              setTimeout(() => verifyTeamLeader(), 100);
                            }}
                            style={{
                              padding: '10px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <strong style={{ color: '#333' }}>{participant.mhid}</strong> - {participant.name}
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              {participant.isPaid ? '✅ Paid' : '❌ Unpaid'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {teamLeaderDetails && (
                    <div className={`payment-status-indicator ${teamLeaderDetails.isPaid ? 'paid' : 'unpaid'}`} style={{ marginTop: '10px' }}>
                      {getPaymentStatusIcon(teamLeaderDetails.paymentStatus)} {teamLeaderDetails.name} - {teamLeaderDetails.paymentStatus.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Members Section */}
              {teamLeaderDetails && teamLeaderDetails.isPaid && (
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'none' }}>
                  <h3 style={{ marginTop: 0 }}>Team Members ({teamMembers.length} / {selectedEvent.maxParticipants - 1})</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>Total Team Size: {teamMembers.length + 1} / {selectedEvent.maxParticipants} (including leader)</p>

                  <div className="form-group">
                    <label>Add Member MHID</label>
                    <div className="mhid-input-group" style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={memberMhidInput}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          if (value.length <= 10) {
                            setMemberMhidInput(value);
                            if (value.length >= 4) {
                              searchMhids(value);
                              setShowSuggestions(true);
                            } else {
                              setShowSuggestions(false);
                            }
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && memberMhidInput.length === 10) {
                            verifyMember();
                            setShowSuggestions(false);
                          }
                        }}
                        onFocus={() => {
                          if (memberMhidInput.length >= 4 && mhidSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        placeholder="MH26000001"
                        maxLength={10}
                      />
                      <button
                        onClick={verifyMember}
                        disabled={verifyingMember || memberMhidInput.length !== 10}
                        className="verify-btn"
                      >
                        {verifyingMember ? 'Verifying...' : 'Verify'}
                      </button>

                      {/* MHID Suggestions Dropdown */}
                      {showSuggestions && mhidSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          marginTop: '5px'
                        }}>
                          {mhidSuggestions.map((participant) => (
                            <div
                              key={participant.mhid}
                              onClick={() => {
                                setMemberMhidInput(participant.mhid);
                                setShowSuggestions(false);
                                // Auto-verify after selection
                                setTimeout(() => verifyMember(), 100);
                              }}
                              style={{
                                padding: '10px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <strong style={{ color: '#333' }}>{participant.mhid}</strong> - {participant.name}
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                {participant.isPaid ? '✅ Paid' : '❌ Unpaid'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {verifiedMember && (
                      <div className="participant-preview" style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '8px' }}>
                        <div className={`payment-status-indicator ${verifiedMember.isPaid ? 'paid' : 'unpaid'}`}>
                          {getPaymentStatusIcon(verifiedMember.paymentStatus)} {verifiedMember.paymentStatus.toUpperCase()}
                        </div>
                        <h4 style={{ margin: '10px 0 5px' }}>{verifiedMember.name}</h4>
                        <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>📧 {verifiedMember.email}</p>
                        <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>📱 {verifiedMember.phone}</p>
                        <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>🆔 {verifiedMember.mhid}</p>
                        {verifiedMember.isPaid && (
                          <button onClick={addMember} className="add-member-btn" style={{ marginTop: '10px' }}>
                            Add to Team
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Team Members List */}
                  {teamMembers.length > 0 && (
                    <div className="members-list" style={{ marginTop: '20px' }}>
                      <h4>Current Team Members:</h4>
                      {teamMembers.map((member, index) => (
                        <div key={member.mhid} className="member-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'white', marginBottom: '10px', borderRadius: '8px' }}>
                          <div>
                            <strong>{index + 1}. {member.name}</strong>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{member.mhid}</div>
                          </div>
                          <button
                            onClick={() => removeMember(member.mhid)}
                            className="remove-member-btn"
                            style={{ padding: '5px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation - HIDDEN */}
              <div className="navigation-buttons" style={{ display: 'none' }}>
                <button
                  className="nav-btn back-btn"
                  onClick={() => {
                    setCurrentStep(2);
                    setSelectedCollege('');
                    setCollegeSearchQuery('');
                    setTeamLeaderName('');
                    setTeamLeaderMhid('');
                    setTeamLeaderDetails(null);
                    setTeamMembers([]);
                  }}
                >
                  ← Back to Events
                </button>
                {teamLeaderDetails && teamLeaderDetails.isPaid && (
                  <button
                    className="nav-btn submit-btn"
                    onClick={handleSubmitTeam}
                    disabled={loading || !selectedCollege || teamMembers.length === 0}
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}
                  >
                    {loading ? 'Submitting...' : 'Register Team 🎉'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default TeamRegistrationNew;
