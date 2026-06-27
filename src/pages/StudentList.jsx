import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToastStore } from '../store/toastStore';
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Eye, 
  AlertCircle 
} from 'lucide-react';

export default function StudentList() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and table state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const studentList = await api.getStudents();
        const courseList = await api.getCourses();
        setStudents(studentList);
        setCourses(courseList);
      } catch (err) {
        addToast(err.message || 'Failed to load students data', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [addToast]);

  // Handle filter/search adjustments
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        s => 
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    // Status filter (Active if active in last 7 days, Inactive if inactive longer)
    if (statusFilter !== 'ALL') {
      result = result.filter(s => {
        const lastActive = new Date(s.lastActiveAt);
        const diffDays = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
        const isActive = diffDays <= 7;
        return statusFilter === 'ACTIVE' ? isActive : !isActive;
      });
    }

    // Course Enrollment filter
    if (courseFilter !== 'ALL') {
      result = result.filter(s => 
        s.enrollments.some(e => e.courseId === courseFilter)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      if (sortBy === 'name_desc') {
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      }
      if (sortBy === 'progress_desc') {
        return b.averageProgress - a.averageProgress;
      }
      if (sortBy === 'progress_asc') {
        return a.averageProgress - b.averageProgress;
      }
      if (sortBy === 'active_desc') {
        return new Date(b.lastActiveAt || 0) - new Date(a.lastActiveAt || 0);
      }
      if (sortBy === 'joined_desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return result;
  }, [students, searchTerm, statusFilter, courseFilter, sortBy]);

  // Pagination helper
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusPill = (lastActiveAt) => {
    if (!lastActiveAt) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Offline</span>;
    const diffDays = (new Date() - new Date(lastActiveAt)) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading student directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Student Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View, search, sort, and manage all enrolled students in Vaizai LMS.</p>
        </div>
      </div>

      {/* Search, Filter, Sort Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-850 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active (Last 7d)</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Course Filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold">
              <span className="text-slate-400">Course:</span>
              <select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[160px]"
              >
                <option value="ALL">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Sort Selection */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="progress_desc">Highest Progress</option>
                <option value="progress_asc">Lowest Progress</option>
                <option value="active_desc">Recently Active</option>
                <option value="joined_desc">Newest Joined</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Student List Table & Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Empty state */}
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-200">No students found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs font-bold text-slate-400 uppercase select-none">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Courses Enrolled</th>
                    <th className="px-6 py-4">Avg. Progress</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                  {paginatedStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      {/* Name/Email Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm uppercase">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer" onClick={() => navigate(`/students/${student.id}`)}>
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="block text-xs text-slate-400 truncate max-w-[200px]">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Course Enrollments count */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-650 dark:text-slate-350">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">{student.coursesCount}</span>
                          <span className="text-xs text-slate-450 dark:text-slate-500">({student.coursesCount === 1 ? 'course' : 'courses'})</span>
                        </div>
                      </td>

                      {/* Average Progress with mini progress bar */}
                      <td className="px-6 py-4">
                        <div className="max-w-[150px]">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            <span>{student.averageProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${student.averageProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Active Status & Date */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getStatusPill(student.lastActiveAt)}
                          <span className="block text-[10px] font-medium text-slate-450 dark:text-slate-500">
                            {student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-850">
              {paginatedStudents.map(student => (
                <div key={student.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm uppercase">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-805 dark:text-slate-200" onClick={() => navigate(`/students/${student.id}`)}>
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="block text-xs text-slate-400">{student.email}</span>
                      </div>
                    </div>
                    {getStatusPill(student.lastActiveAt)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-xs">
                    <div>
                      <span className="block text-slate-450 dark:text-slate-550 font-semibold mb-0.5">Courses</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {student.coursesCount}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-450 dark:text-slate-550 font-semibold mb-0.5">Avg. Progress</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{student.averageProgress}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Joined {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => navigate(`/students/${student.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Table Footer with Pagination controls */}
        {filteredStudents.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-450 dark:text-slate-400">
              Showing <span className="font-bold text-slate-700 dark:text-slate-350">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700 dark:text-slate-350">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="font-bold text-slate-700 dark:text-slate-350">{filteredStudents.length}</span> students
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
