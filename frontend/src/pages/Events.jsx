import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, MapPin, Users, Clock, CheckCircle, 
  AlertCircle, Tag, ArrowRight, Loader
} from 'lucide-react';

const EVENT_TYPES = {
  education: { label: 'Education', color: 'bg-blue-100 text-blue-800' },
  food_drive: { label: 'Food Drive', color: 'bg-orange-100 text-orange-800' },
  health_camp: { label: 'Health Camp', color: 'bg-red-100 text-red-800' },
  cleanliness: { label: 'Cleanliness', color: 'bg-green-100 text-green-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
};

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed

  useEffect(() => {
    fetchEvents();
    fetchMyEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await axiosClient.get('/events', { params });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const res = await axiosClient.get('/my-events');
      setMyEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (eventId) => {
    setActionLoading(eventId);
    setError(null);
    setSuccess(null);
    try {
      await axiosClient.post(`/events/${eventId}/register`);
      setSuccess('Registered successfully!');
      fetchEvents();
      fetchMyEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to register';
      setError(typeof msg === 'string' ? msg : msg.message || 'Registration failed');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregister = async (eventId) => {
    setActionLoading(eventId);
    setError(null);
    try {
      await axiosClient.delete(`/events/${eventId}/register`);
      setSuccess('Unregistered successfully');
      fetchEvents();
      fetchMyEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to unregister');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const isRegistered = (eventId) => {
    if (!myEvents || !myEvents.events) return false;
    return myEvents.events.some(e => e.event && e.event.id === eventId);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/30 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline-lg text-on-background">Events & Drives</h1>
          <p className="text-sm text-on-surface-variant mt-1">Browse and join upcoming volunteering opportunities</p>
        </div>

        {/* My Stats */}
        {myEvents && (
          <div className="flex gap-4 text-center">
            <div className="bg-primary/5 border border-primary/20 px-4 py-2 rounded-lg">
              <p className="text-lg font-bold text-primary">{myEvents.totalRegistered || 0}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Registered</p>
            </div>
            <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
              <p className="text-lg font-bold text-green-700">{myEvents.totalAttended || 0}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Attended</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
              <p className="text-lg font-bold text-blue-700">{myEvents.totalHours ? myEvents.totalHours.toFixed(1) : '0'}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Hours</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'upcoming', 'ongoing', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer capitalize ${
              filter === f ? 'bg-primary text-white shadow-sm' : 'bg-surface-container border border-outline-variant/50 text-on-surface-variant hover:text-primary'
            }`}
          >
            {f === 'all' ? 'All Events' : f}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg text-sm">
          <CheckCircle size={16} /> <span>{success}</span>
        </div>
      )}

      {/* Event Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size={32} className="animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No events found</p>
          <p className="text-sm mt-1">Check back later for new volunteering opportunities!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.other;
            const registered = isRegistered(event.id);
            const isFull = event.maxCapacity && event.registeredCount >= event.maxCapacity;
            const isPast = event.status === 'completed';
            
            return (
              <div key={event.id} className="bg-white rounded-xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {/* Type Banner */}
                <div className={`px-4 py-2 ${typeInfo.color} flex items-center justify-between`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Tag size={10} /> {typeInfo.label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {event.status}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow gap-3">
                  <h3 className="font-headline-md text-base font-bold text-on-surface leading-tight">{event.title}</h3>
                  
                  {event.description && (
                    <p className="text-xs text-on-surface-variant line-clamp-2">{event.description}</p>
                  )}

                  <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-outline-variant/20">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Calendar size={13} className="text-primary" />
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <MapPin size={13} className="text-primary" />
                        <span>{event.location}{event.city ? `, ${event.city}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Users size={13} className="text-primary" />
                      <span>{event.registeredCount} registered{event.maxCapacity ? ` / ${event.maxCapacity} max` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="px-5 pb-5">
                  {isPast ? (
                    <div className="w-full py-2.5 text-center text-xs font-semibold text-on-surface-variant bg-surface-container rounded-lg">
                      Event Completed
                    </div>
                  ) : registered ? (
                    <button
                      onClick={() => handleUnregister(event.id)}
                      disabled={actionLoading === event.id}
                      className="w-full py-2.5 text-xs font-semibold border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === event.id ? 'Processing...' : '✓ Registered — Click to Unregister'}
                    </button>
                  ) : isFull ? (
                    <div className="w-full py-2.5 text-center text-xs font-semibold text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg">
                      Event Full
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={actionLoading === event.id}
                      className="w-full py-2.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-surface-tint transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === event.id ? 'Registering...' : <><span>Join This Drive</span><ArrowRight size={14} /></>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
