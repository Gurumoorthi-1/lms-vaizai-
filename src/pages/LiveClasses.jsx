import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  useLiveClasses,
  useCreateLiveClass,
  useJoinLiveClass,
  useUpdateLiveClass,
  useCancelLiveClass,
  useMarkAttendance,
  useCourses
} from '../hooks/useLms';
import { initSocket, getSocket } from '../services/socket';
import {
  Calendar as CalendarIcon,
  Video,
  MessageSquare,
  ListTodo,
  Plus,
  Clock,
  Play,
  User,
  X,
  Send,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Timer,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { useForm } from 'react-hook-form';

// Countdown Timer Component
function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference <= 0) return 'Starts Now!';

      const hours = Math.floor((difference / (1000 * 60 * 60)));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{timeLeft}</span>;
}

// Class Card Component
function ClassCard({ liveClass, onJoin, onEdit, onCancel, userRole }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUpcoming = liveClass.status === 'UPCOMING';
  const isLive = liveClass.status === 'LIVE';
  const isCompleted = liveClass.status === 'COMPLETED';
  const isCancelled = liveClass.status === 'CANCELLED';
  const canStart = new Date(liveClass.scheduledAt || liveClass.startTime) <= new Date();

  return (
    <div
      className={`bg-white dark:bg-slate-900 border transition-all duration-300 rounded-2xl shadow-sm hover:shadow-md ${
        isCancelled
          ? 'border-red-200 dark:border-red-900/30 opacity-60'
          : isLive
          ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-900/30'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {isLive && (
              <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-rose-100 dark:border-rose-900/40">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                Live Now
              </span>
            )}
            {isUpcoming && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-indigo-100 dark:border-indigo-900/40">
                Upcoming
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-emerald-100 dark:border-emerald-900/40">
                Completed
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-red-100 dark:border-red-900/40">
                Cancelled
              </span>
            )}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">
              {liveClass.courseTitle || 'General'}
            </span>
          </div>

          {(userRole === 'TEACHER' || userRole === 'ADMIN' || userRole === 'INSTRUCTOR') && !isCancelled && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(liveClass)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              {isUpcoming && (
                <button
                  onClick={() => onCancel(liveClass.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Cancel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <h3 className="font-extrabold text-slate-800 dark:text-white text-lg mb-2">{liveClass.title}</h3>
        {liveClass.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{liveClass.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {liveClass.instructorName || 'Instructor'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {liveClass.durationMinutes || liveClass.durationMins || 60} mins
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" />
            {new Date(liveClass.scheduledAt || liveClass.startTime).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {isUpcoming && (
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-indigo-500" />
              <CountdownTimer targetDate={liveClass.scheduledAt || liveClass.startTime} />
            </div>
          )}
          {isCompleted && liveClass.attendanceCount && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold">{liveClass.attendanceCount} attended</span>
            </div>
          )}

          <div className="flex gap-2 ml-auto">
            {!isCancelled && (
              <>
                {isCompleted && (
                  <button
                    onClick={() => onJoin(liveClass)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Watch Recording
                  </button>
                )}
                {!isCompleted && (
                  <button
                    onClick={() => onJoin(liveClass)}
                    disabled={isUpcoming && !canStart}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
                      isLive
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : isUpcoming && !canStart
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    {isLive ? 'Join Now' : isUpcoming && !canStart ? 'Starts Soon' : 'Enter'}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveClass.meetingUrl && (
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">
                  Meeting Link
                </span>
                <a
                  href={liveClass.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline truncate block"
                >
                  {liveClass.meetingUrl}
                </a>
              </div>
            )}
            {isCompleted && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Summary Available</span>
                </div>
                {liveClass.recordingUrl && (
                  <a
                    href={liveClass.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Download Notes
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Live Room Component
function LiveRoom({ liveClass, onExit, user }) {
  const [chatMessages, setChatMessages] = useState(liveClass.chatHistory || []);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      senderName: `${user.firstName} ${user.lastName}`,
      message: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('chat_message', { classId: liveClass.id, ...newMsg });
    }
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900 dark:bg-slate-950 p-4 rounded-3xl overflow-hidden shadow-2xl min-h-[600px]">
      <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
        <div className="flex justify-between items-center bg-slate-800/70 border border-slate-700/50 p-3 rounded-2xl text-white">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wide">
              Streaming Live
            </span>
            <h2 className="font-bold text-sm truncate mt-1">{liveClass.title}</h2>
          </div>
          <button
            onClick={onExit}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mx-auto animate-pulse">
              <Video className="w-8 h-8 text-rose-500" />
            </div>
            <span className="block text-sm font-semibold text-slate-400">Stream connected. Simulating live class webcam feeds.</span>
          </div>

          <div className="absolute left-4 bottom-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{(liveClass.attendanceCount || 0) + chatMessages.length} participants</span>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800/80 p-5 rounded-2xl text-white">
          <h4 className="font-bold text-xs uppercase tracking-wide text-indigo-400 flex items-center gap-1 mb-2">
            <ListTodo className="w-4 h-4" />
            Real-time AI Notes
          </h4>
          <div className="text-xs leading-relaxed text-slate-300 space-y-2">
            <p className="animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Listening to classroom audio stream...
            </p>
            <p className="text-[10px] text-slate-500">AI summaries and transcripts will formulate automatically as the lecture proceeds.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden text-white h-full max-h-[560px]">
        <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
          <span className="font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wide">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Classroom Chat
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[400px]">
          {chatMessages.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">No chat activity yet. Send a message to start!</p>
          )}
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-extrabold text-xs text-indigo-400 truncate">{msg.senderName}</span>
                <span className="text-[10px] text-slate-500 shrink-0 font-medium">{msg.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/30 p-2 rounded-xl border border-slate-800/20">{msg.message}</p>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        <form onSubmit={handleSendChat} className="p-3 border-t border-slate-700/50 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Schedule Form Component
function ClassForm({ isOpen, onClose, onSubmit, editingClass, courses, isLoading }) {
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    defaultValues: editingClass ? {
      title: editingClass.title,
      description: editingClass.description,
      courseId: editingClass.courseId,
      date: new Date(editingClass.scheduledAt || editingClass.startTime).toISOString().split('T')[0],
      time: new Date(editingClass.scheduledAt || editingClass.startTime).toTimeString().slice(0, 5),
      durationMinutes: editingClass.durationMinutes || editingClass.durationMins || 60,
      meetingUrl: editingClass.meetingUrl
    } : {}
  });

  useEffect(() => {
    if (editingClass) {
      setValue('title', editingClass.title);
      setValue('description', editingClass.description);
      setValue('courseId', editingClass.courseId);
      const dateObj = new Date(editingClass.scheduledAt || editingClass.startTime);
      setValue('date', dateObj.toISOString().split('T')[0]);
      setValue('time', dateObj.toTimeString().slice(0, 5));
      setValue('durationMinutes', editingClass.durationMinutes || editingClass.durationMins || 60);
      setValue('meetingUrl', editingClass.meetingUrl);
    } else {
      reset();
    }
  }, [editingClass, setValue, reset]);

  const onFormSubmit = (data) => {
    onSubmit({
      ...data,
      id: editingClass?.id,
      scheduledAt: new Date(`${data.date}T${data.time}`).toISOString()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingClass ? 'Edit Live Class' : 'Schedule Live Class'}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="courseId" className="text-xs font-bold text-slate-500 uppercase block">
            Course
          </label>
          <select
            id="courseId"
            {...register('courseId', { required: 'Please select a course' })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white text-xs ${
              errors.courseId ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500'
            }`}
          >
            <option value="">— Select a course —</option>
            {courses.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.title}
              </option>
            ))}
          </select>
          {errors.courseId && <span className="text-rose-500 text-xs font-bold">{errors.courseId.message}</span>}
        </div>

        <div className="space-y-1">
          <label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase block">
            Lecture Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g., React 19 Compiler Deep Dive"
            {...register('title', { required: 'Title is required' })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white text-xs ${
              errors.title ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500'
            }`}
          />
          {errors.title && <span className="text-rose-500 text-xs font-bold">{errors.title.message}</span>}
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase block">
            Lecture Description
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Brief summary of the live session curriculum..."
            {...register('description', { required: 'Description is required' })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white text-xs ${
              errors.description ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500'
            }`}
          />
          {errors.description && <span className="text-rose-500 text-xs font-bold">{errors.description.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="date" className="text-xs font-bold text-slate-500 uppercase block">
              Date
            </label>
            <input
              id="date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white text-xs ${
                errors.date ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500'
              }`}
            />
            {errors.date && <span className="text-rose-500 text-xs font-bold">{errors.date.message}</span>}
          </div>

          <div className="space-y-1">
            <label htmlFor="time" className="text-xs font-bold text-slate-500 uppercase block">
              Time
            </label>
            <input
              id="time"
              type="time"
              {...register('time', { required: 'Time is required' })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white text-xs ${
                errors.time ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500'
              }`}
            />
            {errors.time && <span className="text-rose-500 text-xs font-bold">{errors.time.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="durationMinutes" className="text-xs font-bold text-slate-500 uppercase block">
              Duration (mins)
            </label>
            <input
              id="durationMinutes"
              type="number"
              placeholder="60"
              min={10}
              max={60}
              {...register('durationMinutes', { required: 'Duration is required', min: 10, max: 60, valueAsNumber: true })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white text-xs ${
                errors.durationMinutes ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500'
              }`}
            />
            {errors.durationMinutes && <span className="text-rose-500 text-xs font-bold">{errors.durationMinutes.message}</span>}
          </div>

          <div className="space-y-1">
            <label htmlFor="meetingUrl" className="text-xs font-bold text-slate-500 uppercase block">
              Meeting Link
            </label>
            <input
              id="meetingUrl"
              type="url"
              placeholder="https://meet.google.com/..."
              {...register('meetingUrl')}
              className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-850"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isLoading ? (editingClass ? 'Updating...' : 'Scheduling...') : (editingClass ? 'Update Class' : 'Schedule Class')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Calendar Component
function CalendarView({ liveClasses }) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOffset = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startDayOffset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getClassesForDay = (day) => {
    return liveClasses.filter((c) => {
      const classDate = new Date(c.scheduledAt || c.startTime);
      return classDate.getDate() === day && classDate.getMonth() === currentMonth && classDate.getFullYear() === currentYear;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="font-bold text-slate-800 dark:text-white">{monthNames[currentMonth]} {currentYear}</h2>
        <span className="text-[10px] uppercase font-extrabold text-indigo-500 tracking-wide">LMS Schedule</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const classes = getClassesForDay(day);
          const isToday = day === currentDate.getDate();
          const hasLive = classes.some((c) => c.status === 'LIVE');
          const hasUpcoming = classes.some((c) => c.status === 'UPCOMING');
          const hasCompleted = classes.some((c) => c.status === 'COMPLETED');

          let dotColor = '';
          if (hasLive) dotColor = 'bg-rose-500';
          else if (hasUpcoming) dotColor = 'bg-indigo-500';
          else if (hasCompleted) dotColor = 'bg-emerald-500';

          return (
            <div
              key={day}
              className={`h-10 w-full flex flex-col items-center justify-center rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                isToday
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {day}
              {dotColor && <span className={`absolute mt-5 w-1.5 h-1.5 rounded-full ${dotColor}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LiveClasses() {
  const { user } = useAuthStore();
  const { data: liveClassesData, isLoading } = useLiveClasses();
  const { data: courses = [] } = useCourses();
  const createClassMutation = useCreateLiveClass();
  const updateClassMutation = useUpdateLiveClass();
  const cancelClassMutation = useCancelLiveClass();
  const joinClassMutation = useJoinLiveClass();
  const markAttendanceMutation = useMarkAttendance();

  const liveClasses = useMemo(() => Array.isArray(liveClassesData) ? liveClassesData : [], [liveClassesData]);

  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [activeClass, setActiveClass] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState({ isOpen: false, classId: null });
  const [isCancelling, setIsCancelling] = useState(false);

  // Socket init
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('vaizai_session_token');
      if (token) {
        initSocket(token);
      }
    }
  }, [user]);

  // Filter classes by tab
  const filteredClasses = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return liveClasses.filter((c) => c.status === 'UPCOMING');
      case 'completed':
        return liveClasses.filter((c) => c.status === 'COMPLETED');
      case 'cancelled':
        return liveClasses.filter((c) => c.status === 'CANCELLED');
      default:
        return liveClasses;
    }
  }, [liveClasses, activeTab]);

  const handleJoin = async (liveClass) => {
    if (liveClass.status === 'COMPLETED') {
      // For completed, just set active class to show recordings/summary
      setActiveClass(liveClass);
      setViewMode('room');
      return;
    }

    // For live or upcoming, check if we have a direct meeting URL
    if (liveClass.meetingUrl && (liveClass.status === 'LIVE' || new Date(liveClass.scheduledAt) <= new Date())) {
      // Open in new tab
      window.open(liveClass.meetingUrl, '_blank');
    }

    // Try join session (for tracking)
    try {
      // Only try to join if it's actually live to avoid 400
      if (liveClass.status === 'LIVE') {
        await joinClassMutation.mutateAsync(liveClass.id);
      }
    } catch (e) {
      console.warn('Join class failed (harmless if not live):', e);
    }

    // Set active class to show the live room view
    setActiveClass(liveClass);
    setViewMode('room');
  };

  const handleCreateOrUpdate = async (data) => {
    try {
      if (data.id) {
        await updateClassMutation.mutateAsync({ id: data.id, classData: data });
      } else {
        await createClassMutation.mutateAsync(data);
      }
      setIsScheduleModalOpen(false);
      setEditingClass(null);
    } catch (e) {
      console.error('Failed to save class:', e);
    }
  };

  const handleCancelClass = (id) => {
    setCancelConfirm({ isOpen: true, classId: id });
  };

  const handleCancelConfirm = async () => {
    setIsCancelling(true);
    try {
      await cancelClassMutation.mutateAsync(cancelConfirm.classId);
    } catch (e) {
      console.error('Failed to cancel class:', e);
    } finally {
      setIsCancelling(false);
      setCancelConfirm({ isOpen: false, classId: null });
    }
  };

  const handleCancelDialogClose = () => {
    if (!isCancelling) setCancelConfirm({ isOpen: false, classId: null });
  };

  const handleEditClass = (liveClass) => {
    setEditingClass(liveClass);
    setIsScheduleModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Live Classes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage live sessions, recordings, and AI-generated summaries.
          </p>
        </div>

        {['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user?.role) && viewMode === 'list' && (
          <button
            onClick={() => {
              setEditingClass(null);
              setIsScheduleModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 text-white font-bold text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Schedule Class
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            {['all', 'upcoming', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {filteredClasses.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center bg-white dark:bg-slate-900 shadow-sm">
                  <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">No classes found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    {activeTab === 'all' ? 'Schedule your first live class to get started!' : `No ${activeTab} classes at this time.`}
                  </p>
                </div>
              ) : (
                filteredClasses.map((liveClass) => (
                  <ClassCard
                    key={liveClass.id}
                    liveClass={liveClass}
                    onJoin={handleJoin}
                    onEdit={handleEditClass}
                    onCancel={handleCancelClass}
                    userRole={user?.role}
                  />
                ))
              )}
            </div>

            <div className="space-y-6">
              <CalendarView liveClasses={liveClasses} />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Class Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="block text-xs text-slate-500 font-bold uppercase">Total</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{liveClasses.length}</span>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    <span className="block text-xs text-indigo-600 font-bold uppercase">Upcoming</span>
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                      {liveClasses.filter((c) => c.status === 'UPCOMING').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <LiveRoom
          liveClass={activeClass}
          onExit={() => {
            setViewMode('list');
            setActiveClass(null);
          }}
          user={user}
        />
      )}

      <ClassForm
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingClass(null);
        }}
        onSubmit={handleCreateOrUpdate}
        editingClass={editingClass}
        courses={courses}
        isLoading={createClassMutation.isPending || updateClassMutation.isPending}
      />

      {/* Delete / Cancel confirmation dialog */}
      <ConfirmationDialog
        isOpen={cancelConfirm.isOpen}
        title="Cancel Live Class"
        message="Are you sure you want to cancel this live class? This action cannot be undone and all enrolled students will be notified."
        confirmText="Yes, Cancel Class"
        cancelText="Keep Class"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelDialogClose}
      />
    </div>
  );
}
