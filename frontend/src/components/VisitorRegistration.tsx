import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CoordinatorDashboard.css';

interface Visitor {
  _id: string;
  name: string;
  phoneNumber: string;
  registeredAt: string;
}

const VisitorRegistration: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setIsLoadingVisitors(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5005/api/visitors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setVisitors(data.visitors);
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setIsLoadingVisitors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Please enter visitor name' });
      return;
    }

    if (!phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'Please enter phone number' });
      return;
    }

    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5005/api/visitors/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phoneNumber })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Visitor registered successfully!' });
        setName('');
        setPhoneNumber('');
        // Refresh visitor list
        fetchVisitors();
      } else {
        setMessage({ type: 'error', text: data.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Error registering visitor:', error);
      setMessage({ type: 'error', text: 'Failed to register visitor. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (visitorId: string) => {
    if (!window.confirm('Are you sure you want to delete this visitor?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5005/api/visitors/${visitorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Visitor deleted successfully' });
        fetchVisitors();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete visitor' });
      }
    } catch (error) {
      console.error('Error deleting visitor:', error);
      setMessage({ type: 'error', text: 'Failed to delete visitor' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Visitor Registration</h1>
          <p className="subtitle">Register visitors for the festival</p>
        </div>
        <button
          className="logout-button"
          onClick={() => navigate('/coordinator')}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="content-area" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          margin: '0 auto'
        }}>
          {/* Registration Form */}
          <div className="card" style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            padding: '40px'
          }}>
            <h2 style={{
              marginBottom: '32px',
              fontSize: '1.75rem',
              color: '#2d3748',
              textAlign: 'center',
              fontWeight: '700'
            }}>
              New Visitor Registration
            </h2>

            {message && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  marginBottom: '24px',
                  backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                  color: message.type === 'success' ? '#155724' : '#721c24',
                  border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                  textAlign: 'center',
                  fontSize: '0.95rem'
                }}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#2d3748'
                  }}
                >
                  Visitor Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label
                  htmlFor="phoneNumber"
                  style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#2d3748'
                  }}
                >
                  Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 28px',
                  backgroundColor: isSubmitting ? '#cbd5e0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.05rem',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  transform: isSubmitting ? 'scale(1)' : 'scale(1)',
                  boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#5568d3';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(102, 126, 234, 0.39)';
                  }
                }}
              >
                {isSubmitting ? 'Registering...' : 'Register Visitor'}
              </button>
            </form>

            {/* Visitors count display */}
            <div style={{
              marginTop: '28px',
              paddingTop: '24px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: '#718096',
                margin: 0
              }}>
                Total Visitors Registered: <strong style={{ color: '#2d3748', fontSize: '1.1rem' }}>{visitors.length}</strong>
              </p>
            </div>
          </div>

          {/* Visitors List - Below the form */}
          {visitors.length > 0 && (
            <div className="card" style={{
              marginTop: '30px',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#2d3748', margin: 0 }}>
                  Recent Visitors
                </h2>
              </div>

              {isLoadingVisitors ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                  Loading visitors...
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' }}>
                          Name
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' }}>
                          Phone
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' }}>
                          Time
                        </th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.slice(0, 10).map((visitor, index) => (
                        <tr
                          key={visitor._id}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f7fafc',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#edf2f7'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f7fafc'}
                        >
                          <td style={{ padding: '12px', fontSize: '0.9rem', color: '#2d3748' }}>
                            {visitor.name}
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.9rem', color: '#4a5568' }}>
                            {visitor.phoneNumber}
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.85rem', color: '#718096' }}>
                            {formatDate(visitor.registeredAt)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDelete(visitor._id)}
                              style={{
                                padding: '6px 16px',
                                backgroundColor: '#fc8181',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f56565';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fc8181';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorRegistration;
