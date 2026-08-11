"use client";

import { useState, useCallback } from "react";
import { Calendar, momentLocalizer, Views, Navigate, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, X, CalendarDays, ChevronLeft, ChevronRight, Clock, Bell, Trash2, Save } from "lucide-react";

const localizer = momentLocalizer(moment);

interface CalendarEditorProps {
  content: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  desc?: string;
  notifyBefore?: number;
  emailNotification?: boolean;
  color?: string;
}

const EVENT_COLORS = [
  { label: 'Blue', value: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6' },
  { label: 'Purple', value: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7' },
  { label: 'Pink', value: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899' },
  { label: 'Green', value: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e' },
  { label: 'Orange', value: '#f97316', bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316' },
];

export default function CalendarEditor({ content, onChange, readOnly }: CalendarEditorProps) {
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const parsed = content ? JSON.parse(content) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
    } catch {
      return [];
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    start: new Date(),
    end: new Date(),
    color: EVENT_COLORS[0].value
  });

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      if (readOnly) return;
      setEditingEvent(null);
      setNewEvent({ 
        start, 
        end, 
        title: "",
        color: EVENT_COLORS[0].value
      });
      setShowModal(true);
    },
    [readOnly]
  );

  const handleSelectEvent = useCallback(
    (event: Event) => {
      if (readOnly) return;
      setEditingEvent(event);
      setNewEvent({
        ...event,
        emailNotification: event.emailNotification !== false,
        notifyBefore: event.notifyBefore || 1440,
      });
      setShowModal(true);
    },
    [readOnly]
  );

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.start) return;

    let updatedEvents: Event[];

    if (editingEvent) {
      updatedEvents = events.map(e => 
        e.id === editingEvent.id 
          ? { ...e, ...newEvent } as Event
          : e
      );
    } else {
      const event: Event = {
        id: crypto.randomUUID(),
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end || newEvent.start,
        allDay: newEvent.allDay,
        emailNotification: newEvent.emailNotification !== false,
        notifyBefore: newEvent.notifyBefore || 1440,
        color: newEvent.color || EVENT_COLORS[0].value,
        desc: newEvent.desc
      };
      updatedEvents = [...events, event];
    }

    setEvents(updatedEvents);
    onChange(JSON.stringify(updatedEvents));
    setShowModal(false);
    setEditingEvent(null);
    setNewEvent({ title: "", start: new Date(), end: new Date(), color: EVENT_COLORS[0].value });
  };

  const handleDeleteEvent = () => {
    if (!eventToDelete) return;
    const updatedEvents = events.filter((e) => e.id !== eventToDelete.id);
    setEvents(updatedEvents);
    onChange(JSON.stringify(updatedEvents));
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  const openDeleteModal = () => {
    if (editingEvent) {
      setEventToDelete(editingEvent);
      setShowDeleteModal(true);
      setShowModal(false);
    }
  };

  const eventStyleGetter = (event: Event) => {
    const color = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];
    return {
      style: {
        backgroundColor: color.bg,
        borderColor: color.border,
        color: '#fff',
        borderLeft: `3px solid ${color.border}`,
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500
      }
    };
  };

  return (
    <div className="h-full w-full bg-[var(--background)] p-6 overflow-y-auto">
      <div className="h-full flex flex-col bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden relative">
        <style jsx global>{`
          .rbc-calendar {
            color: var(--foreground);
            font-family: inherit;
          }
          
          /* Toolbar */
          .rbc-toolbar {
            padding: 20px;
            margin-bottom: 0;
            border-bottom: 1px solid var(--border);
            background: var(--surface-2);
          }
          
          .rbc-toolbar button {
            color: var(--muted);
            border: 1px solid var(--border-strong);
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 14px;
            transition: all 0.2s;
          }
          
          .rbc-toolbar button:hover {
            background-color: var(--surface-3);
            color: var(--foreground);
            border-color: var(--border-strong);
          }
          
          .rbc-toolbar button.rbc-active {
            background-color: #3b82f6;
            border-color: #3b82f6;
            color: white;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
          }

          /* Month View */
          .rbc-month-view {
            border: none;
            background: var(--surface-2);
          }

          .rbc-header {
            padding: 12px;
            font-weight: 600;
            color: var(--muted);
            border-bottom: 1px solid var(--border);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .rbc-month-row {
            border-top: 1px solid var(--border);
          }

          .rbc-day-bg {
            border-left: 1px solid var(--border);
          }

          .rbc-day-bg:hover {
            background-color: var(--surface-3);
          }

          .rbc-off-range-bg {
            background-color: var(--surface);
          }

          .rbc-today {
            background-color: rgba(59, 130, 246, 0.05);
          }

          .rbc-date-cell {
            padding: 8px;
            font-size: 14px;
            color: var(--muted);
          }

          .rbc-now .rbc-date-cell a {
            color: #3b82f6;
            font-weight: 700;
          }

          /* Time View */
          .rbc-time-view {
            border: none;
            background: var(--surface-2);
          }

          .rbc-time-header {
            border-bottom: 1px solid var(--border);
          }

          .rbc-time-content {
            border-top: 1px solid var(--border);
          }

          .rbc-timeslot-group {
            border-left: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
          }

          .rbc-time-slot {
            border-top: 1px solid var(--border);
          }

          .rbc-label {
            color: var(--muted);
          }

          /* Agenda View */
          .rbc-agenda-view {
            border: none;
            background: transparent;
          }

          .rbc-agenda-table {
            border: none !important;
          }

          .rbc-agenda-table thead {
            display: none;
          }

          .rbc-agenda-table tbody > tr {
            display: block;
            margin-bottom: 12px;
            background: var(--surface-2);
            border: 1px solid #27272a;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.2s;
          }

          .rbc-agenda-table tbody > tr:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.5);
            border-color: #3f3f46;
          }

          .rbc-agenda-table td {
            border: none !important;
            padding: 16px !important;
            display: inline-block;
            vertical-align: middle;
          }

          .rbc-agenda-date-cell {
            font-weight: 700;
            color: var(--foreground);
            font-size: 14px;
            width: 150px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .rbc-agenda-time-cell {
            color: var(--muted);
            font-size: 13px;
            font-family: monospace;
            width: 120px;
          }

          .rbc-agenda-event-cell {
            font-weight: 500;
            color: var(--foreground);
            font-size: 15px;
          }
        `}</style>
        
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          selectable={!readOnly}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          view={view}
          onView={setView}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          messages={{
            noEventsInRange: (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <CalendarDays size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No events in this range</p>
                <p className="text-sm opacity-60">Click "Today" or navigate to see more</p>
              </div>
            )
          }}
          components={{
            toolbar: (props) => {
              const { label, onNavigate, onView, views, view } = props;
              return (
                <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-[var(--border)] gap-4 bg-[var(--surface-2)]">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onNavigate(Navigate.TODAY)}
                      className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[#3f3f46] text-[var(--foreground)] rounded-xl text-sm font-medium transition-colors"
                    >
                      Today
                    </button>
                    <div className="flex items-center bg-[var(--surface-2)] rounded-xl p-1">
                      <button 
                        onClick={() => onNavigate(Navigate.PREVIOUS)}
                        className="p-1.5 hover:bg-[#3f3f46] text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        onClick={() => onNavigate(Navigate.NEXT)}
                        className="p-1.5 hover:bg-[#3f3f46] text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--foreground)] ml-2">{label}</h2>
                  </div>

                  <div className="flex items-center gap-2 bg-[var(--surface-2)] p-1 rounded-xl">
                    {(views as any[]).map((name: string) => (
                      <button
                        key={name}
                        onClick={() => onView(name as any)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          view === name 
                            ? 'bg-blue-600 text-[var(--foreground)] shadow-lg shadow-blue-500/20' 
                            : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[#3f3f46]'
                        }`}
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
          }}
        />
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                  {editingEvent ? "Edit Event" : "New Event"}
                </h3>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                  }} 
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-2 hover:bg-[var(--surface-2)] rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                    className="w-full bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl px-4 py-3 border border-[#3f3f46] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Start</label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={moment(newEvent.start).format("YYYY-MM-DD")}
                        onChange={(e) => {
                          const currentTime = moment(newEvent.start).format("HH:mm");
                          setNewEvent({ ...newEvent, start: new Date(`${e.target.value}T${currentTime}`) });
                        }}
                        className="w-full bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl px-3 py-2.5 border border-[#3f3f46] focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                      <input
                        type="time"
                        value={moment(newEvent.start).format("HH:mm")}
                        onChange={(e) => {
                          const currentDate = moment(newEvent.start).format("YYYY-MM-DD");
                          setNewEvent({ ...newEvent, start: new Date(`${currentDate}T${e.target.value}`) });
                        }}
                        className="w-full bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl px-3 py-2.5 border border-[#3f3f46] focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">End</label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={moment(newEvent.end).format("YYYY-MM-DD")}
                        onChange={(e) => {
                          const currentTime = moment(newEvent.end).format("HH:mm");
                          setNewEvent({ ...newEvent, end: new Date(`${e.target.value}T${currentTime}`) });
                        }}
                        className="w-full bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl px-3 py-2.5 border border-[#3f3f46] focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                      <input
                        type="time"
                        value={moment(newEvent.end).format("HH:mm")}
                        onChange={(e) => {
                          const currentDate = moment(newEvent.end).format("YYYY-MM-DD");
                          setNewEvent({ ...newEvent, end: new Date(`${currentDate}T${e.target.value}`) });
                        }}
                        className="w-full bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl px-3 py-2.5 border border-[#3f3f46] focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Color</label>
                  <div className="flex gap-3">
                    {EVENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newEvent.color === color.value 
                            ? 'scale-110 border-white shadow-lg' 
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea
                    value={newEvent.desc || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                    placeholder="Add notes..."
                    rows={3}
                    className="w-full bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl px-4 py-3 border border-[#3f3f46] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                  <Bell size={18} className="text-blue-500" />
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--muted-strong)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newEvent.emailNotification !== false}
                        onChange={(e) => setNewEvent({ ...newEvent, emailNotification: e.target.checked })}
                        className="rounded border-gray-600 bg-[var(--surface-2)] text-blue-600 focus:ring-blue-500"
                      />
                      Email Reminder
                    </label>
                  </div>
                  {newEvent.emailNotification !== false && (
                    <select
                      value={newEvent.notifyBefore || 1440}
                      onChange={(e) => setNewEvent({ ...newEvent, notifyBefore: Number(e.target.value) })}
                      className="bg-[var(--surface-2)] text-[var(--foreground)] text-sm rounded-lg border border-[#3f3f46] px-2 py-1 focus:outline-none focus:border-blue-500"
                    >
                      <option value={15}>15m before</option>
                      <option value={60}>1h before</option>
                      <option value={1440}>1d before</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {editingEvent && (
                  <button
                    onClick={openDeleteModal}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                  }}
                  className="flex-1 bg-[var(--surface-2)] hover:bg-[#3f3f46] text-[var(--foreground)] font-medium py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-[var(--foreground)] font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {editingEvent ? "Update Event" : "Save Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Delete Event?</h3>
            <p className="text-[var(--muted)] mb-6">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEventToDelete(null);
                  setShowModal(true);
                }}
                className="flex-1 bg-[var(--surface-2)] hover:bg-[#3f3f46] text-[var(--foreground)] font-medium py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-[var(--foreground)] font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
