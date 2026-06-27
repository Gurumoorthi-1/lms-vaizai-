import React, { useState, useEffect } from 'react';
import { 
  Award, Search, Filter, Download, CheckCircle, AlertTriangle, 
  Plus, Calendar, User, BookOpen, GraduationCap, ChevronLeft, 
  ChevronRight, Copy, Check, Printer, FileText, QrCode
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function Certificates() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  
  // Data states
  const [certs, setCerts] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'list' | 'verify' | 'issue'
  const [activeTab, setActiveTab] = useState('list');
  
  // List Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  
  // Verify State
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedCert, setVerifiedCert] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Issue Form State
  const [issueForm, setIssueForm] = useState({
    studentId: '',
    courseId: '',
    grade: 'A',
    completionDate: new Date().toISOString().split('T')[0]
  });
  const [issuing, setIssuing] = useState(false);
  
  // Preview Modal State
  const [previewCert, setPreviewCert] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');

  // Fetch all required data
  const loadData = async () => {
    if (authLoading || !user) {
      return;
    }
    
    setLoading(true);
    try {
      const allCerts = await api.getCertificates();
      console.log('[Certificates] getCertificates API response:', allCerts);
      const certsWithId = (Array.isArray(allCerts) ? allCerts : (allCerts?.certificates || [])).map(cert => ({
        ...cert,
        id: cert.id || cert._id,
        pdfUrl: cert.pdfUrl,
        qrCodeUrl: cert.qrCodeUrl
      }));
      console.log('[Certificates] Certs with IDs and URLs:', certsWithId);
      setCerts(certsWithId);
      
      // If user is teacher or admin, fetch students and courses to allow issuance
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        try {
          const studentResult = await api.getStudents();
          console.log('[Certificates] getStudents API response:', studentResult);
          const studentList = studentResult.students || studentResult;
          const mappedStudents = Array.isArray(studentList) ? studentList.map(student => ({
            ...student,
            id: student.id || student._id
          })) : [];
          console.log('[Certificates] Mapped students:', mappedStudents);
          setStudents(mappedStudents);
        } catch (err) {
          console.error('Failed to load students:', err);
        }
        
        try {
          const courseResult = await api.getCourses();
          console.log('[Certificates] getCourses API response:', courseResult);
          const courseList = courseResult.courses || courseResult;
          const mappedCourses = Array.isArray(courseList) ? courseList.map(course => ({
            ...course,
            id: course.id || course._id
          })) : [];
          console.log('[Certificates] Mapped courses:', mappedCourses);
          setCourses(mappedCourses);
        } catch (err) {
          console.error('Failed to load courses:', err);
        }
      }
    } catch (error) {
      addToast(error.message || 'Failed to load certificate records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, authLoading]);

  // Handle Search & Filter logic
  const filteredCerts = certs.filter(cert => {
    const matchesSearch = 
      cert.studentName.toLowerCase().includes(search.toLowerCase()) || 
      cert.courseTitle.toLowerCase().includes(search.toLowerCase()) || 
      cert.verificationCode.toLowerCase().includes(search.toLowerCase()) ||
      cert.id.toLowerCase().includes(search.toLowerCase());
      
    const matchesCourse = selectedCourse === 'all' || cert.courseId === selectedCourse;
    const matchesGrade = selectedGrade === 'all' || cert.grade === selectedGrade;
    
    return matchesSearch && matchesCourse && matchesGrade;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredCerts.length / itemsPerPage);
  const paginatedCerts = filteredCerts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Copy Verification Code to clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast('Verification code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Download Certificate PDF
  const handleDownloadCertificate = async (cert) => {
    try {
      if (!cert.pdfUrl) {
        addToast('Certificate PDF not available yet', 'error');
        return;
      }
      
      // Handle relative URL (from server storage)
      let pdfUrl = cert.pdfUrl;
      if (pdfUrl.startsWith('/')) {
        pdfUrl = `http://localhost:5000${pdfUrl}`;
      }
      
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cert.courseTitle.replace(/\s+/g, '_')}_${cert.studentName.replace(/\s+/g, '_')}_Certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('Certificate downloaded successfully! 📄', 'success');
    } catch (error) {
      console.error('Download error:', error);
      addToast('Failed to download certificate', 'error');
    }
  };

  // Run Verification
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    
    setVerifying(true);
    setHasChecked(false);
    try {
      const result = await api.verifyCertificate(verifyCode.trim().toUpperCase());
      setVerifiedCert(result);
      setHasChecked(true);
      if (result) {
        addToast('Certificate verified successfully! ✅', 'success');
      } else {
        addToast('Invalid verification code. Please check and try again.', 'error');
      }
    } catch (error) {
      addToast('Verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Run Issuance
  const handleIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.studentId || !issueForm.courseId) {
      addToast('Please select a student and a course', 'warning');
      return;
    }
    
    setIssuing(true);
    try {
      console.log('[Certificates] handleIssue - issueForm:', issueForm);
      console.log('[Certificates] handleIssue - students:', students);
      console.log('[Certificates] handleIssue - courses:', courses);
      
      const selectedStudent = students.find(s => String(s.id) === String(issueForm.studentId));
      const selectedC = courses.find(c => String(c.id) === String(issueForm.courseId));
      
      console.log('[Certificates] handleIssue - selectedStudent:', selectedStudent);
      console.log('[Certificates] handleIssue - selectedC:', selectedC);
      
      if (!selectedStudent) {
        addToast('Selected student not found', 'error');
        return;
      }
      if (!selectedC) {
        addToast('Selected course not found', 'error');
        return;
      }
      
      const newCertData = {
        studentId: issueForm.studentId,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        courseId: issueForm.courseId,
        courseTitle: selectedC.title,
        grade: issueForm.grade,
        completionDate: issueForm.completionDate,
      };
      
      await api.issueCertificate(newCertData);
      addToast('Certificate successfully issued! 🎓', 'success');
      
      // Reset form and return to list
      setIssueForm({
        studentId: '',
        courseId: '',
        grade: 'A',
        completionDate: new Date().toISOString().split('T')[0]
      });
      setActiveTab('list');
      loadData();
    } catch (error) {
      console.error('[Certificates] handleIssue error:', error);
      addToast(error.message || 'Failed to issue certificate', 'error');
    } finally {
      setIssuing(false);
    }
  };

  // Print/Download handler
  const handlePrint = () => {
    window.print();
  };

  // Simulated QR Code component
  const QrCodeSvg = ({ code }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
      <svg width="80" height="80" viewBox="0 0 100 100" className="text-slate-900">
        {/* Outer boundary markers */}
        <rect x="5" y="5" width="20" height="20" fill="currentColor" />
        <rect x="8" y="8" width="14" height="14" fill="#ffffff" />
        <rect x="11" y="11" width="8" height="8" fill="currentColor" />
        
        <rect x="75" y="5" width="20" height="20" fill="currentColor" />
        <rect x="78" y="8" width="14" height="14" fill="#ffffff" />
        <rect x="81" y="11" width="8" height="8" fill="currentColor" />
        
        <rect x="5" y="75" width="20" height="20" fill="currentColor" />
        <rect x="8" y="78" width="14" height="14" fill="#ffffff" />
        <rect x="11" y="81" width="8" height="8" fill="currentColor" />
        
        {/* Fake internal blocks */}
        <rect x="35" y="10" width="5" height="15" fill="currentColor" />
        <rect x="45" y="5" width="10" height="5" fill="currentColor" />
        <rect x="60" y="15" width="5" height="10" fill="currentColor" />
        <rect x="10" y="35" width="15" height="5" fill="currentColor" />
        <rect x="5" y="45" width="5" height="10" fill="currentColor" />
        <rect x="20" y="60" width="5" height="5" fill="currentColor" />
        <rect x="35" y="35" width="30" height="30" fill="#6366f1" opacity="0.1" />
        <rect x="45" y="45" width="10" height="10" fill="#6366f1" />
        <path d="M 35,45 H 40 V 55 H 35 Z M 55,35 H 60 V 45 H 55 Z M 65,45 H 70 V 50 H 65 Z M 45,65 H 55 V 70 H 45 Z M 60,65 H 65 V 75 H 60 Z M 70,60 H 80 V 65 H 70 Z M 75,75 H 90 V 80 H 75 Z M 80,40 H 85 V 50 H 80 Z M 35,75 H 40 V 90 H 35 Z M 45,80 H 55 V 85 H 45 Z M 65,80 H 70 V 90 H 65 Z" fill="currentColor" />
      </svg>
      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Verify Code</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Certificates Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Browse earned qualifications, check credential authenticity, or issue new certifications.
          </p>
        </div>

        {/* Tab Switching Navigation */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('list'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex-1 md:flex-none ${
              activeTab === 'list' 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Certificates
          </button>
          
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex-1 md:flex-none ${
              activeTab === 'verify' 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Verify Credential
          </button>

          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex-1 md:flex-none ${
                activeTab === 'issue' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Issue Certificate
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Retrieving certificates ledger...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ALL CERTIFICATES */}
          {activeTab === 'list' && (
            <div className="space-y-6">
              {/* Search and filter toolbar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by student, course, certificate ID, verification code..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Course Filter */}
                  <div className="relative">
                    <select
                      value={selectedCourse}
                      onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
                      className="pl-3 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none cursor-pointer"
                    >
                      <option key="all" value="all">All Subjects</option>
                      {Array.from(new Set(certs.map(c => c.courseId))).map((id, index) => {
                        const title = certs.find(c => c.courseId === id)?.courseTitle || id;
                        console.log('[Certificates] Course filter option:', { id, title, index });
                        return <option key={id || `course-filter-${index}`} value={id}>{title}</option>;
                      })}
                    </select>
                    <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Grade Filter */}
                  <div className="relative">
                    <select
                      value={selectedGrade}
                      onChange={(e) => { setSelectedGrade(e.target.value); setPage(1); }}
                      className="pl-3 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none cursor-pointer"
                    >
                      <option key="all" value="all">All Grades</option>
                      <option key="A" value="A">Grade A</option>
                      <option key="B" value="B">Grade B</option>
                      <option key="Pass" value="Pass">Pass</option>
                    </select>
                    <GraduationCap className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Cards Grid */}
              {paginatedCerts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                  <Award className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4 stroke-1 animate-bounce" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Certificates Found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    No certifications match your query. Try broadening your filter parameters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedCerts.map((cert) => (
                    <div 
                      key={cert.id} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-350 flex flex-col group relative overflow-hidden"
                    >
                      {/* Premium card design elements */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 rounded-xl">
                          <Award className="h-6 w-6 stroke-[2]" />
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                          {cert.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          ID: {cert.id}
                        </h4>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {cert.courseTitle}
                        </h3>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{cert.studentName}</span>
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(cert.completionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                            Grade {cert.grade}
                          </span>
                        </div>
                      </div>

                      {/* Verification section */}
                      <div className="border-t border-slate-100 dark:border-slate-800 mt-6 pt-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Credential Verification Code</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{cert.verificationCode}</p>
                          </div>
                          <button
                            onClick={() => handleCopyCode(cert.verificationCode)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition"
                            title="Copy Verification Code"
                          >
                            {copiedCode === cert.verificationCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-250 font-bold text-xs transition"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>
                          
                          <button
                            onClick={() => handleDownloadCertificate(cert)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setVerifyCode(cert.verificationCode);
                              setActiveTab('verify');
                              // Trigger auto-verification
                              setTimeout(() => {
                                document.getElementById('verify-submit-btn')?.click();
                              }, 100);
                            }}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>Verify</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-6">
                  <span className="text-sm text-slate-500">
                    Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredCerts.length)} of {filteredCerts.length} certificates
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-9 h-9 rounded-xl font-bold text-sm transition ${
                          page === i + 1 
                            ? 'bg-indigo-600 text-white' 
                            : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VERIFY CREDENTIAL */}
          {activeTab === 'verify' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-indigo-500" />
                  <span>Verify Credential Authenticity</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Input the unique verification code located on the certificate margin to verify its authenticity, course details, and validity.
                </p>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Verification Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        placeholder="e.g. VAIZ-2026-ABCDEF"
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase font-mono font-bold dark:text-white"
                        required
                      />
                      <button
                        id="verify-submit-btn"
                        type="submit"
                        disabled={verifying}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50"
                      >
                        {verifying ? 'Checking...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Verification Results Output */}
              {hasChecked && (
                <div className="animate-fade-in">
                  {verifiedCert ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-400/20 rounded-2xl p-6 shadow-sm text-center relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-0 left-0 w-2.5 h-full bg-emerald-500"></div>
                      
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full mb-4">
                          <CheckCircle className="h-10 w-10 stroke-[2]" />
                        </div>
                        
                        <h4 className="text-emerald-700 dark:text-emerald-400 font-extrabold text-lg uppercase tracking-wider">
                          Valid LMS Credential
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                          This certificate is verified as authentic and legally registered in the Vaizai LMS ledger.
                        </p>
                        
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 mt-6 text-left space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Graduate</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{verifiedCert.studentName}</span>
                            </div>
                            
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Qualification</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{verifiedCert.courseTitle}</span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Issue Date</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(verifiedCert.completionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Grade Achieved</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                Grade {verifiedCert.grade}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Verification Authority</span>
                              <span className="text-slate-650 dark:text-slate-400">Vaizai Academics Board</span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Credential Status</span>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ACTIVE
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setPreviewCert(verifiedCert)}
                          className="mt-6 flex items-center justify-center gap-1.5 py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-md"
                        >
                          <FileText className="h-4 w-4" />
                          <span>View Full Certificate</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/20 dark:border-rose-400/20 rounded-2xl p-8 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2.5 h-full bg-rose-500"></div>
                      
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full mb-4">
                          <AlertTriangle className="h-10 w-10 stroke-[2]" />
                        </div>
                        
                        <h4 className="text-rose-700 dark:text-rose-400 font-extrabold text-lg uppercase tracking-wider">
                          Invalid Verification Code
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-md">
                          We could not find any active credentials registered under code <code className="font-mono font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 px-1 py-0.5 rounded">{verifyCode}</code>.
                        </p>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-4 max-w-sm">
                          Please verify spelling (dashes are required), confirm that the certificate hasn't been revoked, or contact system administration.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ISSUE NEW CERTIFICATE */}
          {activeTab === 'issue' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-500" />
                  <span>Issue New Academic Certificate</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Select a student, select their course, define the academic grade, and record the certificate issue date. This credentials the student directly.
                </p>

                <form onSubmit={handleIssue} className="space-y-4">
                  {/* Select Student */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>Select Student Graduate</span>
                    </label>
                    <select
                      value={issueForm.studentId}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, studentId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      required
                    >
                      <option key="" value="">-- Select Student --</option>
                      {students.map((student, index) => {
                        console.log('[Certificates] Student:', student);
                        return (
                          <option key={student.id || `student-${index}`} value={student.id || index}>
                            {student.firstName} {student.lastName} ({student.email})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Select Course */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-slate-400" />
                      <span>Select Course / Subject</span>
                    </label>
                    <select
                      value={issueForm.courseId}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, courseId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      required
                    >
                      <option key="" value="">-- Select Course --</option>
                      {courses.map((c, index) => {
                        console.log('[Certificates] Course:', c);
                        return (
                          <option key={c.id || `course-${index}`} value={c.id || index}>
                            {c.title}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Grade Select */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        <span>Academic Grade</span>
                      </label>
                      <select
                        value={issueForm.grade}
                        onChange={(e) => setIssueForm(prev => ({ ...prev, grade: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      >
                        <option key="A+" value="A+">Grade A+</option>
                        <option key="A" value="A">Grade A</option>
                        <option key="B+" value="B+">Grade B+</option>
                        <option key="B" value="B">Grade B</option>
                        <option key="Pass" value="Pass">Pass</option>
                      </select>
                    </div>

                    {/* Completion Date */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>Completion Date</span>
                      </label>
                      <input
                        type="date"
                        value={issueForm.completionDate}
                        onChange={(e) => setIssueForm(prev => ({ ...prev, completionDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={issuing}
                    className="w-full mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {issuing ? 'Generating Credential...' : 'Generate & Issue Certificate'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* FULL SCREEN DYNAMIC PREVIEW MODAL */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden transform scale-100 animate-zoom-in max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
            
            {/* Header controls (Hidden on Print) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span>Certificate Preview</span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadCertificate(previewCert)}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-250 font-bold text-xs transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible">
              <div className="border-[12px] border-double border-amber-600/30 p-10 bg-slate-50/50 dark:bg-slate-900/20 text-center relative overflow-hidden rounded-lg min-h-[500px] flex flex-col justify-between print:border-[8px] print:bg-white print:rounded-none">
                
                {/* Vintage/Elegant backgrounds */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.01] pointer-events-none">
                  <svg width="100%" height="100%">
                    <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#pattern)" />
                  </svg>
                </div>

                {/* Golden Corner Accents */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-600/50"></div>
                <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-600/50"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-600/50"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-600/50"></div>

                {/* Top Section */}
                <div className="space-y-4">
                  <div className="flex justify-center items-center gap-2">
                    <GraduationCap className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-bold tracking-wider text-slate-900 dark:text-white">VAIZAI ACADEMY</span>
                  </div>
                  <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto"></div>
                  <h4 className="text-[11px] font-bold tracking-[0.25em] text-slate-400 uppercase">
                    Credential of Academic Excellence
                  </h4>
                </div>

                {/* Core Certificate Content */}
                <div className="my-6 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-amber-600 dark:text-amber-500 tracking-wide italic">
                    Certificate of Completion
                  </h2>
                  
                  <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                    This is proudly presented to
                  </p>
                  
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight border-b-2 border-slate-200 dark:border-slate-800 pb-2 max-w-xl mx-auto font-sans">
                    {previewCert.studentName}
                  </h1>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                    for successfully demonstrating mastery and completing all requirements for the intensive educational curriculum of
                  </p>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    {previewCert.courseTitle}
                  </h3>
                  
                  <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
                    <span>COMPLETED WITH GRADE</span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded font-black">
                      {previewCert.grade}
                    </span>
                  </p>
                </div>

                {/* Bottom Signatures / Verification Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mt-6">
                  
                  {/* Left: Signatures */}
                  <div className="flex gap-10 text-center order-2 md:order-1">
                    <div className="space-y-1">
                      <div className="font-serif italic text-slate-800 dark:text-slate-250 text-sm border-b border-slate-300 dark:border-slate-800 pb-1 w-32">
                        Dr. A. Vaizai
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Academy President</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="font-serif italic text-slate-800 dark:text-slate-250 text-sm border-b border-slate-300 dark:border-slate-800 pb-1 w-32">
                        Prof. Elena R.
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Dean of Curriculum</p>
                    </div>
                  </div>

                  {/* Center: Golden Seal Graphic */}
                  <div className="relative w-20 h-20 flex items-center justify-center order-1 md:order-2 shrink-0">
                    <div className="absolute inset-0 bg-amber-500 rounded-full animate-pulse opacity-10"></div>
                    <div className="absolute w-16 h-16 rounded-full border-4 border-dashed border-amber-600/40 flex items-center justify-center">
                      <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    {/* Wavy ribbon tails */}
                    <div className="absolute bottom-[-10px] left-[25px] w-4 h-8 bg-amber-650 opacity-40 transform rotate-12 -z-10"></div>
                    <div className="absolute bottom-[-10px] right-[25px] w-4 h-8 bg-amber-650 opacity-40 transform -rotate-12 -z-10"></div>
                  </div>

                  {/* Right: Verification QR and metadata */}
                  <div className="flex items-center gap-4 text-left order-3">
                    <div className="hidden sm:block text-xs space-y-1 text-slate-500">
                      <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider">Credential Verification</p>
                      <p className="font-mono text-[10px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {previewCert.verificationCode}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Date: {new Date(previewCert.completionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <QrCodeSvg code={previewCert.verificationCode} />
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
