import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // Fetch events on load
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
      // Make sure data is an array
      if (Array.isArray(data)) {
        setEvents(data);
      } else if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
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
        setFormData({ title: '', description: '', date: '', location: '' });
        setEditingId(null);
        fetchEvents();
        setError('');
      } else {
        setError('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Error saving event');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
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
      description: event.description,
      date: event.date ? event.date.split('T')[0] : '',
      location: event.location
    });
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
        setError('');
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
  };

  if (!token) {
    return (
      <div className="login-container">
        <h2>Event Manager Login</h2>
        {error && <div style={{color: 'red'}}>{error}</div>}
        <form onSubmit={handleLogin}>
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <p>Try: admin@example.com / password123</p>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>Event Manager</h1>
        <div>
          Welcome, {user?.name || user?.email || 'User'}!
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div style={{color: 'red', padding: '10px'}}>{error}</div>}

      <div className="event-form">
        <h2>{editingId ? 'Edit Event' : 'Create New Event'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Event Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            required
          />
          <button type="submit">{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" onClick={() => {
            setEditingId(null);
            setFormData({ title: '', description: '', date: '', location: '' });
          }}>Cancel</button>}
        </form>
      </div>

      <div className="events-list">
        <h2>Upcoming Events</h2>
        {events.length === 0 ? (
          <p>No events found. Create your first event!</p>
        ) : (
          events.map(event => (
            <div key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p>📅 {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</p>
              <p>📍 {event.location}</p>
              <button onClick={() => handleEdit(event)}>Edit</button>
              <button onClick={() => handleDelete(event.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
