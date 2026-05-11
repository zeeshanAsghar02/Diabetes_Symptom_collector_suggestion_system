import axiosInstance from './axiosInstance';

// NOTE: Request interceptor for auth token is already in axiosInstance.js
// Do NOT add duplicate interceptors here to avoid multiple token attachments

const API_URL = 'https://zeeshanasghar02-diavise-backend.hf.space';

export async function fetchDiseases() {
  const res = await axiosInstance.get(`/diseases`);
  return res.data.data;
}

export async function addDisease(disease) {
  const res = await axiosInstance.post(`/diseases`, disease);
  return res.data.data;
}

export async function updateDisease(id, disease) {
  const res = await axiosInstance.put(`/diseases/${id}`, disease);
  return res.data.data;
}

export async function deleteDisease(id) {
  const res = await axiosInstance.delete(`/diseases/${id}`);
  return res.data;
}

// Removed fetchQuestions and fetchSymptoms using API_BASE as API_BASE is not defined. Use fetchSymptomsByDisease and fetchQuestionsBySymptom instead.

export async function fetchSymptomsByDisease(diseaseId) {
  const res = await axiosInstance.get(`/symptoms/${diseaseId}`);
  return res.data.data || [];
}

export async function addSymptom(diseaseId, symptom) {
  const res = await axiosInstance.post(`/symptoms/${diseaseId}`, symptom);
  return res.data.data;
}

export async function updateSymptom(id, symptom) {
  const res = await axiosInstance.put(`/symptoms/${id}`, symptom);
  return res.data.data;
}

export async function deleteSymptom(id) {
  const res = await axiosInstance.delete(`/symptoms/${id}`);
  return res.data;
}

export async function fetchQuestionsBySymptom(symptomId) {
  const res = await axiosInstance.get(`/questions/questions/symptom/${symptomId}`);
  // Accept both direct array and { data: array }
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data.data)) return res.data.data;
  return [];
}

export async function addQuestion(symptomId, question) {
  const res = await axiosInstance.post(`/questions/questions/symptom/${symptomId}`, question);
  return res.data.data;
}

export async function updateQuestion(id, question) {
  const res = await axiosInstance.put(`/questions/questions/${id}`, question);
  return res.data.data;
}

export async function deleteQuestion(id) {
  const res = await axiosInstance.delete(`/questions/questions/${id}`);
  return res.data;
}

export async function fetchMyDiseaseData() {
  const res = await axiosInstance.get(`/users/my-disease-data`);
  return res.data.data;
}

// Disease data editing functions
export async function fetchDiseaseDataForEditing() {
  const res = await axiosInstance.get(`/users/disease-data-for-editing`);
  return res.data.data;
}

export async function updateDiseaseDataAnswer(questionId, answerText) {
  const res = await axiosInstance.put(`/users/update-disease-data-answer`, {
    questionId,
    answerText
  });
  return res.data;
}

export async function submitDiseaseData() {
  const res = await axiosInstance.post(`/users/submit-disease-data`);
  return res.data;
} 

// Run diabetes assessment (will use cached result if available unless force_new=true)
export async function assessDiabetesRisk(forceNew = false) {
  const url = forceNew ? `/assessment/diabetes?force_new=true` : `/assessment/diabetes`;
  const res = await axiosInstance.post(url);
  return res.data.data;
}

// Get latest cached diabetes assessment (never runs model, only fetches cached result)
export async function getLatestDiabetesAssessment() {
  const res = await axiosInstance.get(`/assessment/diabetes/latest`);
  return res.data.data;
}

// CMS API Functions
// Categories
export async function fetchCategories(status = 'active') {
  // Backend uses isActive boolean, not status string
  const isActive = status === 'active' ? 'true' : status === 'inactive' ? 'false' : undefined;
  const url = isActive ? `/categories?isActive=${isActive}` : '/categories';
  const res = await axiosInstance.get(url);
  return res.data.data;
}

export async function fetchCategory(id) {
  const res = await axiosInstance.get(`/categories/${id}`);
  return res.data.data;
}

export async function createCategory(category) {
  const res = await axiosInstance.post(`/categories`, category);
  return res.data.data;
}

export async function updateCategory(id, category) {
  const res = await axiosInstance.put(`/categories/${id}`, category);
  return res.data.data;
}

export async function deleteCategory(id) {
  const res = await axiosInstance.delete(`/categories/${id}`);
  return res.data;
}

export async function fetchCategoryStats() {
  const res = await axiosInstance.get(`/categories/stats`);
  return res.data.data;
}

// Content
export async function fetchContent(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const res = await axiosInstance.get(`/content?${queryParams}`);
  return res.data;
}

export async function fetchContentById(id) {
  const res = await axiosInstance.get(`/content/${id}`);
  return res.data.data;
}

export async function fetchContentBySlug(slug) {
  const res = await axiosInstance.get(`/content/slug/${slug}`);
  return res.data.data;
}

export async function createContent(content) {
  const res = await axiosInstance.post(`/content`, content);
  return res.data.data;
}

export async function updateContent(id, content) {
  const res = await axiosInstance.put(`/content/${id}`, content);
  return res.data.data;
}

export async function deleteContent(id) {
  const res = await axiosInstance.delete(`/content/${id}`);
  return res.data;
}

export async function fetchContentStats() {
  const res = await axiosInstance.get(`/content/stats`);
  return res.data.data;
}

export async function reviewContentApi(id, payload) {
  const res = await axiosInstance.put(`/content/${id}/review`, payload);
  return res.data.data;
}

export async function fetchRelatedContent(id) {
  const res = await axiosInstance.get(`/content/${id}/related`);
  return res.data.data;
}

// Account: change password (current + new)
export async function changePassword(currentPassword, newPassword) {
  const res = await axiosInstance.post(`/auth/change-password`, {
    currentPassword,
    newPassword,
  }, { withCredentials: true });
  return res.data;
}

// Optional: update own profile via admin endpoint when permitted
export async function updateUserProfile(userId, payload) {
  const res = await axiosInstance.put(`/users/updateUser/${userId}`, payload);
  return res.data;
}

// Feedback API Functions
export async function fetchAllFeedback(page = 1, limit = 10) {
  const res = await axiosInstance.get(`/feedback?page=${page}&limit=${limit}`);
  return res.data.data;
}

export async function fetchFeedbackStats() {
  const res = await axiosInstance.get(`/feedback/stats`);
  return res.data.data;
}

export async function fetchMyFeedback() {
  const res = await axiosInstance.get(`/feedback/my-feedback`);
  return res.data.data;
}

export async function submitFeedback(rating, comment, is_anonymous = false, category_ratings = undefined) {
  const res = await axiosInstance.post(`/feedback`, {
    rating,
    comment,
    is_anonymous,
    category_ratings,
  });
  return res.data;
}

export async function updateFeedbackById(id, rating, comment, is_anonymous, category_ratings = undefined) {
  const res = await axiosInstance.put(`/feedback/${id}`, {
    rating,
    comment,
    is_anonymous,
    category_ratings,
  });
  return res.data;
}

export async function deleteFeedbackById(id) {
  const res = await axiosInstance.delete(`/feedback/${id}`);
  return res.data;
}

// ---------------- Admin Feedback APIs ----------------
export async function fetchAdminFeedback(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const res = await axiosInstance.get(`/admin/feedback?${queryParams}`);
  return res.data.data;
}

export async function fetchAdminFeedbackStats(days = 30) {
  const res = await axiosInstance.get(`/admin/feedback/stats?days=${days}`);
  return res.data.data;
}

export async function updateAdminFeedbackStatus(id, status) {
  const res = await axiosInstance.patch(`/admin/feedback/${id}/status`, { status });
  return res.data.data;
}

export async function addAdminFeedbackResponse(id, admin_response) {
  const res = await axiosInstance.patch(`/admin/feedback/${id}/response`, { admin_response });
  return res.data.data;
}

export async function adminDeleteFeedback(id) {
  const res = await axiosInstance.delete(`/admin/feedback/${id}`);
  return res.data;
}

export async function adminRestoreFeedback(id) {
  const res = await axiosInstance.post(`/admin/feedback/${id}/restore`);
  return res.data;
}

// Audit Logs API
export async function fetchAuditLogs(params = {}) {
  // Filter out undefined, null, and empty string values
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  const queryParams = new URLSearchParams(cleanParams).toString();
  const res = await axiosInstance.get(`/admin/audit-logs?${queryParams}`);
  return res.data;
}

export async function fetchAuditAnalytics(params = {}) {
  // Filter out undefined, null, and empty string values
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  const queryParams = new URLSearchParams(cleanParams).toString();
  const res = await axiosInstance.get(`/admin/audit-logs/analytics?${queryParams}`);
  return res.data;
}

export async function exportAuditLogs(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const res = await axiosInstance.get(`/admin/audit-logs/export?${queryParams}`, {
    responseType: 'blob',
  });
  return res.data;
}

// Settings API
export async function fetchAllSettings() {
  const res = await axiosInstance.get('/admin/settings');
  return res.data;
}

export async function fetchSettingByKey(key) {
  const res = await axiosInstance.get(`/admin/settings/${key}`);
  return res.data;
}

export async function updateSetting(key, value) {
  // If key is 'bulk', send entire value object as bulk update
  if (key === 'bulk') {
    const res = await axiosInstance.put('/admin/settings', value);
    return res.data;
  }
  // Otherwise, update single field
  const res = await axiosInstance.put(`/admin/settings/${key}`, { value });
  return res.data;
}

export async function bulkUpdateSettings(settings) {
  const res = await axiosInstance.put('/admin/settings', settings);
  return res.data;
}

// Public Settings API (no auth)
export async function fetchPublicSettings() {
  const res = await axiosInstance.get('/public/settings');
  return res.data;
}
