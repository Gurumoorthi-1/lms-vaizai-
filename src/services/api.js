import { authService } from '../auth/services/authService';

const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('vaizai_session_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed with status ${res.status}`);
  }
  return res.json();
};

/**
 * Wrapper around fetch that auto-refreshes the access token on 401
 * and retries the request once with the new token.
 */
const fetchWithAuth = async (url, options = {}) => {
  const res = await fetch(url, options);

  if (res.status === 401) {
    // Attempt to refresh the access token
    const newToken = await authService.refreshAccessToken();
    if (newToken) {
      // Rebuild headers with the new token
      const retryHeaders = { ...options.headers };
      if (retryHeaders.Authorization || (options.headers && options.headers.Authorization)) {
        retryHeaders.Authorization = `Bearer ${newToken}`;
      } else if (!retryHeaders['Content-Type'] || retryHeaders['Content-Type'] === 'application/json') {
        // For requests that use getHeaders()
        retryHeaders.Authorization = `Bearer ${newToken}`;
      }

      // For FormData requests (no Content-Type header set by us)
      if (options.body instanceof FormData) {
        retryHeaders.Authorization = `Bearer ${newToken}`;
      }

      const retryRes = await fetch(url, { ...options, headers: retryHeaders });
      return retryRes;
    }
  }

  return res;
};


export const api = {
  // ─── Auth ─────────────────────────────────────────────────────────────────
  async login(credentials) { return authService.login(credentials); },
  async register(userData) { return authService.register(userData); },
  async logout() { return authService.logout(); },
  async me() { return authService.me(); },

  // ─── Courses ──────────────────────────────────────────────────────────────
  async getCourses(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_URL}/courses${qs ? `?${qs}` : ''}`);
    return handleResponse(res);
  },

  async getCourse(id) {
    const res = await fetchWithAuth(`${API_URL}/courses/${id}`);
    return handleResponse(res);
  },

  async createCourse(courseData) {
    const res = await fetchWithAuth(`${API_URL}/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    return handleResponse(res);
  },

  async updateCourse(id, courseData) {
    const res = await fetchWithAuth(`${API_URL}/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    return handleResponse(res);
  },

  async deleteCourse(id) {
    const res = await fetchWithAuth(`${API_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async publishCourse(id) {
    const res = await fetchWithAuth(`${API_URL}/courses/${id}/publish`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Enrollments ──────────────────────────────────────────────────────────
  async getEnrollments() {
    const res = await fetchWithAuth(`${API_URL}/students/me/history`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async enrollInCourse(courseId) {
    const res = await fetchWithAuth(`${API_URL}/students/enroll/${courseId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async dropCourse(courseId) {
    const res = await fetchWithAuth(`${API_URL}/students/enroll/${courseId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateProgress(courseId, progress) {
    const res = await fetchWithAuth(`${API_URL}/students/progress/${courseId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(progress),
    });
    return handleResponse(res);
  },

  // ─── Assignments ──────────────────────────────────────────────────────────
  async getAssignments(courseId) {
    const url = courseId ? `${API_URL}/assignments/course/${courseId}` : `${API_URL}/assignments`;
    console.log('getAssignments called with courseId:', courseId, 'url:', url);
    const res = await fetchWithAuth(url, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createAssignment(courseId, assignmentData) {
    const res = await fetchWithAuth(`${API_URL}/assignments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...assignmentData, courseId }),
    });
    return handleResponse(res);
  },

  async getSubmissions(assignmentId) {
    const res = await fetchWithAuth(`${API_URL}/assignments/${assignmentId}/submissions`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getMySubmission(assignmentId) {
    const res = await fetchWithAuth(`${API_URL}/assignments/${assignmentId}/my-submission`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async submitAssignment(assignmentId, { content, file }) {
    const token = localStorage.getItem('vaizai_session_token');
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (file) formData.append('file', file);

    console.log('submitAssignment called with:', { assignmentId, content, file });
    console.log('FormData has content:', formData.has('content'));
    console.log('FormData has file:', formData.has('file'));

    const res = await fetchWithAuth(`${API_URL}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    return handleResponse(res);
  },

  async gradeSubmission(submissionId, gradeData) {
    const payload = {
      marks: gradeData.grade,
      teacherFeedback: gradeData.feedback
    };
    const res = await fetchWithAuth(`${API_URL}/assignments/submissions/${submissionId}/evaluate`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async generateAIFeedback(submissionId, textContent) {
    const res = await fetchWithAuth(`${API_URL}/assignments/submissions/${submissionId}/ai-feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ textContent }),
    });
    return handleResponse(res);
  },

  // ─── Quizzes ──────────────────────────────────────────────────────────────
  async getQuizzes(courseId) {
    const res = await fetchWithAuth(`${API_URL}/quizzes/course/${courseId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getQuiz(quizId) {
    const res = await fetchWithAuth(`${API_URL}/quizzes/${quizId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createQuiz(courseId, quizData) {
    const res = await fetchWithAuth(`${API_URL}/quizzes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...quizData, courseId }),
    });
    return handleResponse(res);
  },

  async submitQuizAnswers(quizId, answers) {
    const res = await fetchWithAuth(`${API_URL}/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answers }),
    });
    return handleResponse(res);
  },

  async getQuizAttempts(quizId) {
    const res = await fetchWithAuth(`${API_URL}/quizzes/${quizId}/attempts`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Students ─────────────────────────────────────────────────────────────
  async getStudents(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_URL}/students${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getStudentProfile(studentId) {
    const res = await fetchWithAuth(`${API_URL}/students/${studentId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Certificates ─────────────────────────────────────────────────────────
  async getCertificates() {
    const res = await fetchWithAuth(`${API_URL}/certificates/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async issueCertificate(certData) {
    const res = await fetchWithAuth(`${API_URL}/certificates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(certData),
    });
    return handleResponse(res);
  },

  async verifyCertificate(certificateId) {
    const res = await fetchWithAuth(`${API_URL}/certificates/verify/${certificateId}`);
    return handleResponse(res);
  },

  async downloadCertificate(certificateId) {
    const res = await fetchWithAuth(`${API_URL}/certificates/download/${certificateId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Live Sessions ────────────────────────────────────────────────────────
  async getLiveClasses(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_URL}/live-sessions${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getLiveClass(id) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getLiveSessionsByCourse(courseId) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/course/${courseId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createLiveClass(classData) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(classData),
    });
    return handleResponse(res);
  },

  async updateLiveClass(id, classData) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(classData),
    });
    return handleResponse(res);
  },

  async cancelLiveClass(id) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async joinLiveClass(classId) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/${classId}/join`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async markAttendance(classId) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/${classId}/attendance`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getClassAttendance(classId) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/${classId}/attendance`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getClassRecording(classId) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/${classId}/recording`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAISummary(classId) {
    const res = await fetchWithAuth(`${API_URL}/live-sessions/${classId}/ai-summary`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Forum ────────────────────────────────────────────────────────────────
  async getForumQuestions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_URL}/forum${qs ? `?${qs}` : ''}`);
    return handleResponse(res);
  },

  async getForumPost(postId) {
    const res = await fetchWithAuth(`${API_URL}/forum/${postId}`);
    return handleResponse(res);
  },

  async createForumQuestion(questionData) {
    const res = await fetchWithAuth(`${API_URL}/forum`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData),
    });
    return handleResponse(res);
  },

  async createForumReply(postId, replyData) {
    const res = await fetchWithAuth(`${API_URL}/forum/${postId}/reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(replyData),
    });
    return handleResponse(res);
  },

  async voteForumQuestion(postId) {
    const res = await fetchWithAuth(`${API_URL}/forum/${postId}/like`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async bookmarkForumQuestion(postId) {
    const res = await fetchWithAuth(`${API_URL}/forum/${postId}/bookmark`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getForumCategories() {
    const res = await fetchWithAuth(`${API_URL}/forum/categories`);
    return handleResponse(res);
  },

  // ─── AI ───────────────────────────────────────────────────────────────────
  async sendAiMessage(message, sessionId) {
    const res = await fetchWithAuth(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, sessionId }),
    });
    const data = await handleResponse(res);
    return data.result;
  },

  async generateQuiz(topic, difficulty = 'medium', numQuestions = 5) {
    const res = await fetchWithAuth(`${API_URL}/ai/quiz`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ topic, difficulty, numQuestions }),
    });
    const data = await handleResponse(res);
    return data.result;
  },

  // ─── Analytics ────────────────────────────────────────────────────────────
  async getAnalyticsData() {
    const res = await fetchWithAuth(`${API_URL}/analytics/overview`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAnalyticsGrowth(interval = 'weekly') {
    const res = await fetchWithAuth(`${API_URL}/analytics/growth?interval=${interval}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getTeacherPerformance() {
    const res = await fetchWithAuth(`${API_URL}/analytics/teachers`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Notifications ────────────────────────────────────────────────────────
  async getNotifications(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_URL}/notifications${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetchWithAuth(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetchWithAuth(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deleteNotification(id) {
    const res = await fetchWithAuth(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Progress ─────────────────────────────────────────────────────────────
  async getProgressReport(studentId) {
    const res = await fetchWithAuth(`${API_URL}/progress/${studentId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Uploads ──────────────────────────────────────────────────────────────
  async uploadFile(type, file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('vaizai_session_token');
    const res = await fetchWithAuth(`${API_URL}/uploads/${type}`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    return handleResponse(res);
  },

  // ─── Admin / Settings ─────────────────────────────────────────────────────
  async getSettings(key) {
    const url = key
      ? `${API_URL}/admin/settings/${key}`
      : `${API_URL}/admin/settings`;
    const res = await fetchWithAuth(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateSettings(key, value) {
    const res = await fetchWithAuth(`${API_URL}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ key, value }),
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetchWithAuth(`${API_URL}/admin/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  async updatePassword(currentPassword, newPassword) {
    const res = await fetchWithAuth(`${API_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },



  // ─── User Settings & Security ─────────────────────────────────────────────
  async updateUserSettings(settingsData) {
    const res = await fetchWithAuth(`${API_URL}/auth/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settingsData),
    });
    return handleResponse(res);
  },

  async updateUserPassword(currentPassword, newPassword) {
    const res = await fetchWithAuth(`${API_URL}/auth/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },

  async getActiveSessions() {
    const res = await fetchWithAuth(`${API_URL}/auth/sessions`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async revokeSession(id) {
    const res = await fetchWithAuth(`${API_URL}/auth/sessions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getApiKeys() {
    const res = await fetchWithAuth(`${API_URL}/auth/apikeys`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async generateApiKey(name) {
    const res = await fetchWithAuth(`${API_URL}/auth/apikeys`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },

  async revokeApiKey(id) {
    const res = await fetchWithAuth(`${API_URL}/auth/apikeys/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

