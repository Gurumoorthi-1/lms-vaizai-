import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useToastStore } from '../store/toastStore';

// Courses Hooks
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const result = await api.getCourses();
      const courses = result.courses || result;
      // Map MongoDB _id to id for frontend
      return courses.map(course => ({
        ...course,
        id: course._id?.toString() || course._id
      }));
    },
    refetchInterval: 10000 // 10 seconds
  });
}

export function useCourse(id) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => api.getCourse(id),
    enabled: !!id
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (courseData) => api.createCourse(courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast('Course created successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to create course', 'error');
    }
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ id, courseData }) => api.updateCourse(id, courseData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', data.id] });
      addToast('Course updated successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to update course', 'error');
    }
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (id) => api.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast('Course deleted successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to delete course', 'error');
    }
  });
}

// Enrollments Hooks
export function useEnrollments() {
  return useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const result = await api.getEnrollments();
      const enrollments = result.enrollments || result;
      // Map MongoDB _id and courseId for frontend
      return enrollments.map(enrollment => {
        // courseId may be a populated object {_id, title, ...} or a raw ObjectId string
        const rawCourseId = enrollment.courseId;
        const courseId = rawCourseId?._id
          ? rawCourseId._id.toString()
          : rawCourseId?.toString?.() || String(rawCourseId);

        return {
          ...enrollment,
          id: enrollment._id?.toString() || enrollment.id,
          courseId,
          courseName: rawCourseId?.title || enrollment.courseName || ''
        };
      });
    },
    refetchInterval: 10000 // 10 seconds
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (courseId) => api.enrollInCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      addToast('Enrolled in course successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to enroll', 'error');
    }
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, progress }) => api.updateProgress(courseId, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    }
  });
}

// Assignments Hooks
export function useAssignments(courseId) {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      const assignments = await api.getAssignments(courseId);
      return assignments.map(assignment => ({
        ...assignment,
        id: assignment._id || assignment.id
      }));
    },
    enabled: true,
    refetchInterval: 10000 // 10 seconds
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ courseId, assignmentData }) => api.createAssignment(courseId, assignmentData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', data.courseId] });
      addToast('Assignment created successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to create assignment', 'error');
    }
  });
}

// Submissions Hooks
export function useSubmissions(assignmentId) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => api.getSubmissions(assignmentId),
    enabled: !!assignmentId
  });
}

// Fetch current student's own submission for a single assignment
export function useMySubmission(assignmentId, enabled = true) {
  return useQuery({
    queryKey: ['mySubmission', assignmentId],
    queryFn: () => api.getMySubmission(assignmentId),
    enabled: !!assignmentId && enabled,
    retry: false
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ assignmentId, content, file }) => api.submitAssignment(assignmentId, { content, file }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', data.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['mySubmission', data.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      addToast('Assignment submitted successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Submission failed', 'error');
    }
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ submissionId, gradeData }) => api.gradeSubmission(submissionId, gradeData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', data.assignmentId] });
      addToast('Submission graded successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to submit grade', 'error');
    }
  });
}

export function useGenerateAIFeedback() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ submissionId, textContent }) => api.generateAIFeedback(submissionId, textContent),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', data.assignmentId] });
      addToast('AI feedback generated successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to generate AI feedback', 'error');
    }
  });
}

// Quizzes Hooks
export function useQuizzes(courseId) {
  return useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: async () => {
      const result = await api.getQuizzes(courseId);
      return result.quizzes || result;
    },
    enabled: !!courseId,
    refetchInterval: 10000 // 10 seconds
  });
}

export function useQuiz(quizId) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => api.getQuiz(quizId),
    enabled: !!quizId
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ courseId, quizData }) => api.createQuiz(courseId, quizData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', data.courseId] });
      addToast('Quiz created successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to create quiz', 'error');
    }
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ quizId, answers }) => api.submitQuizAnswers(quizId, answers),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quizAttempts', variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      addToast(`Quiz submitted! Score: ${data.score}%`, 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Quiz submission failed', 'error');
    }
  });
}

export function useQuizAttempts(quizId) {
  return useQuery({
    queryKey: ['quizAttempts', quizId],
    queryFn: () => api.getQuizAttempts(quizId),
    enabled: !!quizId
  });
}

// Live Classes Hooks
export function useLiveClasses() {
  return useQuery({
    queryKey: ['liveClasses'],
    queryFn: async () => {
      const data = await api.getLiveClasses();
      const classes = Array.isArray(data) ? data : (Array.isArray(data?.liveSessions) ? data.liveSessions : []);
      return classes.map(c => ({ ...c, id: c._id || c.id }));
    }
  });
}

export function useLiveClass(id) {
  return useQuery({
    queryKey: ['liveClass', id],
    queryFn: async () => {
      const data = await api.getLiveClass(id);
      return { ...data, id: data._id || data.id };
    },
    enabled: !!id
  });
}

export function useCreateLiveClass() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (classData) => api.createLiveClass(classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] });
      addToast('Live class scheduled successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to schedule class', 'error');
    }
  });
}

export function useUpdateLiveClass() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ id, classData }) => api.updateLiveClass(id, classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] });
      addToast('Live class updated successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to update class', 'error');
    }
  });
}

export function useCancelLiveClass() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (id) => api.cancelLiveClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] });
      addToast('Live class cancelled successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to cancel class', 'error');
    }
  });
}

export function useJoinLiveClass() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (classId) => api.joinLiveClass(classId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] });
      addToast(`Joined live class: ${data.title}`, 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to join live class', 'error');
    }
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (classId) => api.markAttendance(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveClasses'] });
      addToast('Attendance marked successfully', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to mark attendance', 'error');
    }
  });
}

export function useClassAttendance(classId) {
  return useQuery({
    queryKey: ['classAttendance', classId],
    queryFn: () => api.getClassAttendance(classId),
    enabled: !!classId
  });
}

export function useClassRecording(classId) {
  return useQuery({
    queryKey: ['classRecording', classId],
    queryFn: () => api.getClassRecording(classId),
    enabled: !!classId
  });
}

export function useAISummary(classId) {
  return useQuery({
    queryKey: ['aiSummary', classId],
    queryFn: () => api.getAISummary(classId),
    enabled: !!classId
  });
}
