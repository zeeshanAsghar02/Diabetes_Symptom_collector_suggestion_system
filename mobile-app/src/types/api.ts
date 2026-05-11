/**
 * API Request/Response Types
 */

// Common API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  dateOfBirth: string; // ISO date string
  gender: 'Male' | 'Female';
  phoneNumber?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// User
export interface User {
  _id: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  phoneNumber?: string;
  country?: string;
  isActivated: boolean;
  diabetes_diagnosed: 'yes' | 'no' | null;
  diabetes_diagnosed_answered_at?: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  diseaseDataSubmittedAt?: string;
  diseaseDataEditingExpiresAt?: string;
  diseaseDataStatus?: 'draft' | 'submitted';
  last_assessment_risk_level?: string;
  last_assessment_probability?: number;
  last_assessment_date?: string;
  createdAt: string;
  updatedAt: string;
}

// Assessment
export interface AssessmentRequest {
  force_new?: boolean;
}

export interface AssessmentResponse {
  risk_level: 'High' | 'Medium' | 'Low';
  probability: number;
  risk_factors: string[];
  recommendations: string[];
  feature_importance: Record<string, number>;
  assessment_date: string;
  cached: boolean;
}

// Personal Info
export interface PersonalInfo {
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other' | string;
  height?: number | string;
  weight?: number | string;
  activity_level?:
    | 'Sedentary'
    | 'Lightly Active'
    | 'Moderately Active'
    | 'Very Active'
    | 'Extra Active'
    | string;
  dietary_preference?: string;
  smoking_status?: string;
  alcohol_use?: string;
  sleep_hours?: number | string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
}

// Medical Info
export interface MedicalInfo {
  diabetes_type?:
    | 'Type 1'
    | 'Type 2'
    | 'Gestational'
    | 'Prediabetes'
    | 'LADA'
    | 'MODY'
    | string;
  diagnosis_date?: string;
  current_medications?: Array<{
    medication_name?: string;
    dosage?: string;
    frequency?: string;
  }>;
  allergies?: Array<{
    allergen?: string;
    reaction?: string;
  }>;
  chronic_conditions?: Array<{
    condition_name?: string;
    diagnosed_date?: string;
  }>;
  family_history?: Array<{
    relation?: string;
    condition?: string;
  }>;
  last_medical_checkup?: string;
}

// Diet Plan
export interface MealItem {
  food: string;
  portion: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
}

export interface Meal {
  name: string;
  timing?: string;
  items: MealItem[];
  total_calories: number;
}

export interface NutritionalSummary {
  total_calories?: number;
  calories?: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface DietPlan {
  _id: string;
  user_id: string;
  target_date: string;
  region?: string;
  total_calories?: number;
  meals: Meal[];
  nutritional_summary?: NutritionalSummary;
  nutritional_totals?: NutritionalSummary;
  recommendations?: string[];
  tips?: string[];
  sources?: Array<{ title: string; country?: string; doc_type?: string }>;
  status?: string;
  created_at: string;
}

export interface GenerateDietPlanRequest {
  target_date?: string; // ISO date string
}

// Exercise Plan
export interface Exercise {
  category: 'Cardio' | 'Strength' | 'Flexibility' | 'Balance';
  name: string;
  duration_minutes: number;
  intensity: 'Low' | 'Moderate' | 'High';
  calories_burned: number;
  instructions: string;
  precautions: string[];
}

export interface ExercisePlan {
  _id: string;
  user: string;
  target_date: string;
  exercises: Exercise[];
  total_duration_minutes: number;
  total_calories_burned: number;
  created_at: string;

  // Optional fields for weekly/goal-based plans (backend may include these)
  start_date?: string;
  end_date?: string;
  goal?: string;
  weekly_schedule?: Array<{
    day: string;
    activity_type?: string;
    details?: string;
    exercises: Exercise[];
  }>;
  general_recommendations?: string[];
}

export interface GenerateExercisePlanRequest {
  target_date?: string;
  goal?: string;
}

// Lifestyle Tips
export interface LifestyleTip {
  _id: string;
  category: 'Nutrition' | 'Exercise' | 'Medication' | 'Monitoring' | 'Mental Health' | 'Sleep';
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  icon?: string;
  date: string;
}

// Monthly Diet Plan
export interface WeeklySummary {
  week: number;
  start_date: string;
  end_date: string;
  avg_calories: number;
  total_days: number;
}

export interface MonthlyDietPlan {
  _id: string;
  user: string;
  month: string; // YYYY-MM
  weeks: WeeklySummary[];
  daily_plans: DietPlan[];
  created_at: string;
}

// Habits
export interface Habit {
  _id: string;
  title: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly';
  completed: boolean;
  streak: number;
}

// Habits (user-managed)
export interface UserHabit {
  _id: string;
  name: string;
  status: 'active' | 'paused';
  createdAt?: string;
  updatedAt?: string;
}

export interface HabitProgress {
  habitId: string;
  completed: boolean;
  date: string;
}

// Feedback
export interface Feedback {
  _id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  status: 'published' | 'hidden';
  admin_response?: string | null;
  submitted_on: string;
  category_ratings?: Record<string, number>;
  deleted_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitFeedbackRequest {
  rating: number;
  comment?: string;
  is_anonymous?: boolean;
  category?: string;
  category_ratings?: Record<string, number>;
}

// Chat
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface SendMessageRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  sources?: string[];
  context_used: boolean;
}

// Disease/Symptom (for assessment)
export interface Disease {
  _id: string;
  name: string;
  description: string;
}

export interface Symptom {
  _id: string;
  name: string;
  description: string;
  disease: string;
}

export interface Question {
  _id: string;
  question_text: string;
  question_type: 'text' | 'number' | 'radio' | 'checkbox' | 'dropdown' | 'textarea' | 'date' | 'select' | 'range';
  /** @deprecated Use question_type instead */
  input_type?: string;
  options?: string[];
  symptom: string;
  disease: string;
  render_config?: {
    type: string;
    config: {
      from_units: Array<{
        name: string;
        label: string;
        options?: number[];
      }>;
      to_unit: string;
    };
  };
}

export interface Answer {
  _id: string;
  user: string;
  question: string;
  answer_text?: string;
  selected_option?: string;
  disease: string;
  symptom: string;
  last_modified: string;
}

export interface SaveAnswersRequest {
  answers: Array<{
    questionId: string;
    answer: string;
    diseaseId: string;
    symptomId: string;
  }>;
  age: number;
  gender: 'Male' | 'Female';
}

// Content/Articles
export interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  author?: string;
  publishedAt: string;
  thumbnail?: string;
}

export interface Content {
  _id: string;
  title: string;
  type: 'article' | 'video' | 'infographic' | 'guide';
  content: string;
  excerpt: string;
  tags: string[];
  author?: string | { fullName: string; email: string };
  publishedAt: string;
  createdAt?: string;
  thumbnail?: string;
  viewCount: number;
  category?: string | { _id: string; name: string; slug?: string; color?: string; icon?: string };
  readingTime?: number;
  featuredImage?: { url: string; alt?: string };
  slug?: string;
  isFeatured?: boolean;
}

export interface Testimonial {
  _id: string;
  name: string;
  content: string;
  rating: number;
  location?: string;
  date: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

// Assessment Result
export interface AssessmentResult {
  risk_level: 'High' | 'Medium' | 'Low';
  probability: number;
  risk_factors: string[];
  recommendations: string[];
  assessment_date: string;
}

// Profile Updates
export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  country?: string;
  dateOfBirth?: string;
}

export interface UpdateMedicalInfoRequest {
  diabetesType?: 'Type 1' | 'Type 2' | 'Gestational' | 'Prediabetes';
  medication?: string;
  a1cLevel?: number;
  complications?: string;
  allergies?: string;
  height?: number;
  weight?: number;
  activityLevel?: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
}

// Habits (user-managed)
export interface CreateHabitPayload {
  name: string;
  status: 'active' | 'paused';
}

export interface UpdateHabitPayload {
  name?: string;
  status?: 'active' | 'paused';
}

// Feedback Requests
export interface CreateFeedbackRequest {
  rating: number;
  comment?: string;
  is_anonymous?: boolean;
  category?: 'bug' | 'feature' | 'general' | string;
  category_ratings?: Record<string, number>;
}

// Health Metrics
export type MetricType =
  | 'blood_glucose'
  | 'hba1c'
  | 'blood_pressure'
  | 'weight'
  | 'steps'
  | 'distance'
  | 'calories_burned'
  | 'sleep_time'
  | 'heart_rate';

export interface HealthMetric {
  _id: string;
  user_id: string;
  type: MetricType;
  value: number | { systolic: number; diastolic: number };
  timestamp: string;
}

export interface HealthSummary {
  [key: string]: HealthMetric | null;
}

// Profile
export interface Profile {
  user: User;
  personalInfo: PersonalInfo;
  medicalInfo: MedicalInfo;
}

export interface UpdateProfilePayload {
  personalInfo?: Partial<PersonalInfo>;
  medicalInfo?: Partial<MedicalInfo>;
}

// Assessment
export interface DiseaseData {
  disease: string;
  lastUpdated: string;
  symptoms: {
    name: string;
    questions: {
      question_id: string;
      question: string;
      answer: string;
      date: string;
    }[];
  }[];
  totalQuestions: number;
  answeredQuestions: number;
}

export interface NextQuestion {
    question: Question;
    options: Answer[];
    isLastQuestion: boolean;
    progress: {
        answered: number;
        total: number;
    };
}
