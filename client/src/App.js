import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    image_url: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAdminRegister, setShowAdminRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    student_id: ''
  });
  const [adminRegisterData, setAdminRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    student_id: ''
  });

  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchUser();
    }
  }, [token]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchComments = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          comment: newComment
        })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments(selectedEvent.id);
      } else {
        setError('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          fetchComments(selectedEvent.id);
        } else {
          setError('Failed to delete comment');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        setError('Failed to delete comment');
      }
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    fetchComments(event.id);
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only images are allowed');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
    setUploading(true);
    setError('');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', selectedFile);
    
    try {
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: uploadFormData
      });
      
      const data = await response.json();
      if (response.ok) {
        setFormData({ ...formData, image_url: data.fileUrl });
        setError('');
      } else {
        setError('File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = editingId 
      ? `http://localhost:5000/api/events/${editingId}`
      : 'http://localhost:5000/api/events';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormData({ 
          title: '', 
          category: '', 
          description: '', 
          date: '', 
          time: '', 
          venue: '',
          image_url: ''
        });
        setImagePreview('');
        setFile(null);
        setEditingId(null);
        setShowForm(false);
        fetchEvents();
        setError('');
      } else {
        const errorData = await response.json();
        setError('Failed to save event: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Error saving event');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/events/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchEvents();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      category: event.category || '',
      description: event.description,
      date: event.date ? event.date.split('T')[0] : '',
      time: event.time || '',
      venue: event.venue || '',
      image_url: event.image_url || ''
    });
    setImagePreview(event.image_url || '');
    setShowForm(true);
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          student_id: registerData.student_id
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsRegistering(false);
        setError('');
        setRegisterData({ name: '', email: '', password: '', confirmPassword: '', student_id: '' });
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed');
    }
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    if (adminRegisterData.password !== adminRegisterData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: adminRegisterData.name,
          email: adminRegisterData.email,
          password: adminRegisterData.password,
          student_id: adminRegisterData.student_id
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setShowAdminRegister(false);
        setError('Admin user created successfully!');
        setAdminRegisterData({ name: '', email: '', password: '', confirmPassword: '', student_id: '' });
        setTimeout(() => setError(''), 3000);
      } else {
        setError(data.error || 'Admin registration failed');
      }
    } catch (error) {
      console.error('Admin registration error:', error);
      setError('Admin registration failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        const userResponse = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        const userData = await userResponse.json();
        setUser(userData);
        setError('');
        setIsRegistering(false);
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setEvents([]);
    setShowForm(false);
    setShowEventModal(false);
  };

  const isAdmin = user?.role === 'admin';

  const getFilteredEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(activeTab) {
      case 'upcoming':
        return events.filter(event => new Date(event.date) >= today);
      case 'past':
        return events.filter(event => new Date(event.date) < today);
      case 'all':
        return events;
      default:
        return events;
    }
  };

  const filteredEvents = getFilteredEvents();

  // Login/Register Screen
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>📅 Event Manager</h1>
          <h2>{isRegistering ? 'Student Registration' : 'Login to Continue'}</h2>
          {error && <div className="error-message">{error}</div>}
          
          {!isRegistering ? (
            <>
              <form onSubmit={handleLogin}>
                <input type="email" name="email" placeholder="Email" required />
                <input type="password" name="password" placeholder="Password" required />
                <button type="submit">Login</button>
              </form>
              <p className="register-link">
                Don't have an account?{' '}
                <button onClick={() => setIsRegistering(true)} className="link-btn">
                  Register as Student
                </button>
              </p>
              <p className="demo-credentials">
                <strong>Demo Accounts:</strong><br />
                Student: student@example.com / password<br />
                Admin: admin@zut.ac.zm / password
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleStudentRegister}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Student ID (Optional)"
                  value={registerData.student_id}
                  onChange={(e) => setRegisterData({...registerData, student_id: e.target.value})}
                />
                <button type="submit">Register as Student</button>
              </form>
              <p className="register-link">
                Already have an account?{' '}
                <button onClick={() => setIsRegistering(false)} className="link-btn">
                  Back to Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main App Screen
  return (
    <div className="App">
      <header>
        <div className="header-content">
          <h1>📅 Event Manager</h1>
          <div className="user-info">
            <span className={`user-role-badge ${isAdmin ? 'admin' : 'student'}`}>
              {isAdmin ? '👑 Admin' : '🎓 Student'}
            </span>
            <span className="user-name">👋 Welcome, {user?.name || user?.email || 'User'}!</span>
            {isAdmin && (
              <button onClick={() => setShowAdminRegister(!showAdminRegister)} className="admin-register-btn">
                {showAdminRegister ? '✖ Close' : '➕ Register Admin'}
              </button>
            )}
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Admin Registration Form */}
      {isAdmin && showAdminRegister && (
        <div className="admin-register-form">
          <h3>Register New Admin</h3>
          <form onSubmit={handleAdminRegister}>
            <input
              type="text"
              placeholder="Full Name"
              value={adminRegisterData.name}
              onChange={(e) => setAdminRegisterData({...adminRegisterData, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={adminRegisterData.email}
              onChange={(e) => setAdminRegisterData({...adminRegisterData, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={adminRegisterData.password}
              onChange={(e) => setAdminRegisterData({...adminRegisterData, password: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={adminRegisterData.confirmPassword}
              onChange={(e) => setAdminRegisterData({...adminRegisterData, confirmPassword: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Staff ID (Optional)"
              value={adminRegisterData.student_id}
              onChange={(e) => setAdminRegisterData({...adminRegisterData, student_id: e.target.value})}
            />
            <button type="submit">Create Admin User</button>
          </form>
        </div>
      )}

      <div className="main-container">
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            📅 Upcoming Events
          </button>
          <button 
            className={`tab ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            ⏪ Past Events
          </button>
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📋 All Events
          </button>
          {isAdmin && (
            <button 
              className={`tab create-tab ${showForm ? 'active' : ''}`}
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setEditingId(null);
                  setFormData({
                    title: '', category: '', description: '', 
                    date: '', time: '', venue: '', image_url: ''
                  });
                  setImagePreview('');
                }
              }}
            >
              {showForm ? '✖ Close Form' : '➕ Create Event'}
            </button>
          )}
        </div>

        {isAdmin && showForm && (
          <div className="event-form">
            <h2>{editingId ? '✏️ Edit Event' : '➕ Create New Event'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    placeholder="Enter event title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="academic">🎓 Academic</option>
                    <option value="sports">⚽ Sports</option>
                    <option value="workshop">💻 Workshop</option>
                    <option value="social">🎉 Social</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea
                    placeholder="Describe the event..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Venue *</label>
                  <input
                    type="text"
                    placeholder="Event location"
                    value={formData.venue}
                    onChange={(e) => setFormData({...formData, venue: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Event Flyer/Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && <p className="upload-status">📤 Uploading...</p>}
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({...formData, image_url: ''});
                          setFile(null);
                        }}
                      >
                        ✖ Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={uploading} className="submit-btn">
                  {uploading ? 'Uploading...' : (editingId ? '✏️ Update Event' : '➕ Create Event')}
                </button>
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="events-section">
          <div className="events-header">
            <h2>{activeTab === 'upcoming' ? '📅 Upcoming Events' : activeTab === 'past' ? '⏪ Past Events' : '📋 All Events'}</h2>
            <div className="event-count">{filteredEvents.length} events</div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <p>No events found.</p>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map(event => (
                <div key={event.id} className="event-card">
                  {event.image_url ? (
                    <div className="event-image" onClick={() => handleViewEvent(event)}>
                      <img src={event.image_url} alt={event.title} />
                    </div>
                  ) : (
                    <div className="event-image placeholder" onClick={() => handleViewEvent(event)}>
                      <span>📷</span>
                    </div>
                  )}
                  <div className="event-content">
                    <div className="event-header">
                      <h3>{event.title}</h3>
                      <span className={`category-badge ${event.category}`}>
                        {event.category}
                      </span>
                    </div>
                    <p className="event-description">{event.description?.substring(0, 100)}...</p>
                    <div className="event-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span>{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏰</span>
                        <span>{event.time || 'TBD'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{event.venue}</span>
                      </div>
                    </div>
                    <button className="view-details-btn" onClick={() => handleViewEvent(event)}>
                      View Details & Comments 💬
                    </button>
                    {isAdmin && (
                      <div className="event-actions">
                        <button className="edit-btn" onClick={() => handleEdit(event)}>✏️ Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(event.id)}>🗑️ Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEventModal(false)}>✖</button>
            
            {selectedEvent.image_url && (
              <div className="modal-image">
                <img src={selectedEvent.image_url} alt={selectedEvent.title} />
              </div>
            )}
            
            <div className="modal-body">
              <h2>{selectedEvent.title}</h2>
              <span className={`category-badge ${selectedEvent.category}`}>
                {selectedEvent.category}
              </span>
              
              <div className="modal-details">
                <p><strong>📅 Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()}</p>
                <p><strong>⏰ Time:</strong> {selectedEvent.time}</p>
                <p><strong>📍 Venue:</strong> {selectedEvent.venue}</p>
              </div>
              
              <div className="modal-description">
                <h3>Description</h3>
                <p>{selectedEvent.description}</p>
              </div>
              
              <div className="comments-section">
                <h3>💬 Comments ({comments.length})</h3>
                
                <form onSubmit={handleAddComment} className="add-comment-form">
                  <textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows="3"
                    required
                  />
                  <button type="submit">Post Comment</button>
                </form>
                
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments">No comments yet.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <strong>{comment.user_name || comment.user_email}</strong>
                          <span className="comment-date">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                          {(isAdmin || comment.user_id === user?.id) && (
                            <button 
                              className="delete-comment-btn"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <p className="comment-text">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
