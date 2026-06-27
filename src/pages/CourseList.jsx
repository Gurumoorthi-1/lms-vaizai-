import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/authStore';
import { 
  useCourses, 
  useEnrollments, 
  useEnrollInCourse, 
  useCreateCourse, 
  useDeleteCourse 
} from '../hooks/useLms';
import { CourseCardSkeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Plus, Trash2, Edit, Award, User, ArrowRight, CheckCircle2 } from 'lucide-react';

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Too long'),
  category: z.string().min(2, 'Category is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional()
});

export default function CourseList() {
  const { user } = useAuthStore();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  
  const enrollMutation = useEnrollInCourse();
  const createMutation = useCreateCourse();
  const deleteMutation = useDeleteCourse();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'enrolled' (for students)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', description: '', category: '', level: 'Beginner' }
  });

  const onSubmitCreate = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateModalOpen(false);
      reset();
    } catch (err) {
      // Handled by mutation hook toast
    }
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    try {
      await deleteMutation.mutateAsync(courseToDelete);
    } finally {
      setCourseToDelete(null);
    }
  };

  const isEnrolled = (courseId) => {
    return enrollments?.some(e => String(e.courseId) === String(courseId)) || false;
  };

  const getProgress = (courseId) => {
    const enrollment = enrollments?.find(e => String(e.courseId) === String(courseId));
    return enrollment ? enrollment.progress : 0;
  };

  // Filter courses based on search term
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (user?.role === 'STUDENT' && activeTab === 'enrolled') {
      return matchesSearch && isEnrolled(course.id);
    }

    if (user?.role === 'TEACHER') {
      return matchesSearch && course.teacherId === user.id;
    }

    return matchesSearch;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Courses</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {user?.role === 'TEACHER' ? 'Manage your syllabus and course list.' : 'Explore available training and educational content.'}
          </p>
        </div>

        {user?.role === 'TEACHER' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Create Course</span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Tabs for Students */}
        {user?.role === 'STUDENT' && (
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all
                ${activeTab === 'all' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }
              `}
            >
              All Courses
            </button>
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all
                ${activeTab === 'enrolled' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }
              `}
            >
              My Enrollments
            </button>
          </div>
        )}
      </div>

      {/* Grid of Courses */}
      {coursesLoading || enrollmentsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center bg-white dark:bg-slate-900">
          <BookOpen className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-1">No courses found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search criteria or tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            const progress = getProgress(course.id);

            return (
              <div 
                key={course.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 group overflow-hidden"
              >
                {/* Top Gradient Accent */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <div className="space-y-4 p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 flex-1">
                          {course.title}
                        </h3>
                        
                        {/* Delete Action (Admins or Owning Teacher) */}
                        {(user?.role === 'ADMIN' || (user?.role === 'TEACHER' && course.teacherId === user.id)) && (
                          <button
                            onClick={() => setCourseToDelete(course.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all focus:outline-none shrink-0"
                            aria-label="Delete course"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {enrolled && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Enrolled</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium pt-2">
                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <span>Instructor: {course.teacherName}</span>
                  </div>

                  {/* Progress Bar (if student and enrolled) */}
                  {user?.role === 'STUDENT' && enrolled && (
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Course Progress</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 pt-2">
                  {user?.role === 'STUDENT' ? (
                    enrolled ? (
                      <Link
                        to={`/courses/${course.id}`}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg hover:shadow-indigo-500/30 w-full"
                      >
                        <span>Enter Classroom</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => enrollMutation.mutate(course.id)}
                        disabled={enrollMutation.isPending}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg hover:shadow-indigo-500/30 w-full disabled:opacity-60"
                      >
                        {enrollMutation.isPending ? (
                          <span>Enrolling...</span>
                        ) : (
                          <>
                            <span>Enroll in Course</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <Link
                      to={`/courses/${course.id}`}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-sm transition-all w-full"
                    >
                      <span>Manage Syllabus</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
        }}
        title="Create New Course"
      >
        <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="title" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Course Title
            </label>
            <input
              id="title"
              placeholder="e.g. Advanced JavaScript & Security Principles"
              {...register('title')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                ${errors.title ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'}
              `}
            />
            {errors.title && (
              <p className="text-rose-500 text-xs font-medium" role="alert">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Course Description
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Provide a comprehensive outline of the course topic, syllabus summary, and requirements..."
              {...register('description')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm resize-none
                ${errors.description ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'}
              `}
            />
            {errors.description && (
              <p className="text-rose-500 text-xs font-medium" role="alert">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="category" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Category
            </label>
            <input
              id="category"
              placeholder="e.g. Programming, Data Science, Business, Design"
              {...register('category')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                ${errors.category ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'}
              `}
            />
            {errors.category && (
              <p className="text-rose-500 text-xs font-medium" role="alert">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="level" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Level
            </label>
            <select
              id="level"
              {...register('level')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                ${errors.level ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'}
              `}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                reset();
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!courseToDelete}
        title="Delete Course Syllabus"
        message="Are you sure you want to completely delete this course? This action will permanently wipe all enrolled students, quizzes, assignments, and submitted attempts. This action is irreversible."
        confirmText="Yes, delete course"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCourseToDelete(null)}
      />
    </div>
  );
}
