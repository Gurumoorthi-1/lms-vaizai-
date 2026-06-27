import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  Mail,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

// Custom social media icons
function GitHubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.029 1.595 1.029 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function UserProfile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(null);
  const fileInputRef = useRef(null);

  // Real-time states
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollmentData, certData] = await Promise.all([
          api.getEnrollments().catch(() => []),
          api.getCertificates().catch(() => [])
        ]);
        setEnrollments(Array.isArray(enrollmentData) ? enrollmentData : []);
        setCertificates(Array.isArray(certData) ? certData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
    }
  };

  const completedCourses = enrollments.filter(e => e.completed || e.progress === 100).length;

  const stats = [
    { label: 'Courses Enrolled', value: enrollments.length.toString(), icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Completed', value: completedCourses.toString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Certificates', value: certificates.length.toString(), icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Learning Hours', value: `${Math.round(enrollments.length * 8.5)}h`, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  ];

  const skills = [
    'React.js', 'JavaScript', 'Node.js', 'Tailwind CSS', 'UI/UX Design', 'Python', 'Machine Learning'
  ];

  const timeline = [
    { title: 'Joined Vaizai LMS', date: new Date(user?.createdAt || Date.now()).toLocaleDateString(), type: 'system' },
  ];

  if (user?.createdAt) {
    if (certificates.length > 0) {
      timeline.unshift({ title: `Earned Certificate for Course`, date: 'Recent', type: 'achievement' });
    }
    if (enrollments.length > 0) {
      timeline.unshift({ title: `Enrolled in ${enrollments[0]?.courseName || 'New Course'}`, date: 'Recent', type: 'course' });
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <button className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-lg backdrop-blur-sm transition-colors">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row gap-6">
            
            {/* Avatar */}
            <div className="-mt-16 relative group shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-4xl font-bold">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                )}
                {/* Upload Overlay */}
                <div 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
            </div>

            {/* User Info */}
            <div className="mt-2 sm:mt-4 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    LMS User • {user?.role}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> India
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" /> Learning Platform
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mr-2 text-indigo-600" />
          <span>Loading profile details...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Left Column (Sidebar) */}
          <div className="space-y-6">
            {/* About */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">About</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {user?.bio || 'No bio provided yet. Click Edit Profile to add a custom bio description.'}
              </p>
              
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4" /> {user?.email || 'email@example.com'}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Main Content) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className={`p-3 rounded-xl mb-3 ${stat.bg} ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{stat.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Activity Timeline */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
              </div>
              
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8">
                {timeline.map((item, i) => (
                  <div key={i} className="relative pl-6">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</h4>
                      <span className="text-xs text-slate-500">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
