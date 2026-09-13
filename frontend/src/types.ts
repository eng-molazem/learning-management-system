export type Role = "student" | "instructor" | "admin";
export type UserStatus = "active" | "pending" | "rejected" | "banned";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatar: string | null;
  bio: string;
  xp: number;
  level: number;
  streak: number;
  lang_pref: "ar" | "en";
  stats?: {
    courses_enrolled: number;
    courses_completed: number;
    certificates_earned: number;
  };
}

export interface Category {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  icon?: string;
}

export interface Path {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
  color?: string;
  level: string;
  course_count?: number;
  courses?: Course[];
}

export interface Course {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  instructor_id: string;
  instructor?: { id: string; name: string; avatar: string | null };
  category?: Category;
  category_id: string;
  path_id?: string | null;
  thumbnail: string | null;
  is_free: boolean;
  price: number;
  currency: string;
  level: "beginner" | "intermediate" | "advanced";
  language: "ar" | "en";
  status: "draft" | "published";
  has_exam: boolean;
  exam?: { questions: ExamQuestion[] };
  rating_avg: number;
  rating_count: number;
  lesson_count?: number;
  student_count?: number;
  is_enrolled?: boolean;
  progress?: number;
  created_at: string;
}

export interface ExamQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface Module {
  id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  content: string | null;
  video_type: "youtube" | "upload" | "none";
  video_url: string | null;
  video_file_path: string | null;
  order: number;
  duration: number;
  is_preview: boolean;
  locked?: boolean;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  completion_date: string | null;
  course?: Course;
}

export interface CourseDetail extends Course {
  modules: Module[];
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_code: string;
  grade: string;
  issued_at: string;
  payment_status: string;
  pdf_path: string;
  course?: Course;
  student_name?: string;
}

export interface Book {
  id: string;
  title_ar: string;
  title_en: string;
  author?: string;
  description_ar?: string;
  description_en?: string;
  category_id?: string;
  cover: string | null;
  file_path: string | null;
  is_free: boolean;
  price: number;
  is_purchased?: boolean;
}

export interface Project {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  price: number;
  thumbnail: string | null;
  file_path: string | null;
  tech_stack: string[];
  demo_url?: string;
  is_purchased?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  course_id: string | null;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  author: { id: string; name: string; avatar: string | null } | null;
  comment_count: number;
  like_count: number;
  liked_by_me: boolean;
  comments?: CommunityComment[];
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: { id: string; name: string; avatar: string | null } | null;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  xp: number;
  level: number;
  streak: number;
}

export interface CartItem {
  id: string;
  item_type: "course" | "book" | "project";
  item_id: string;
  title: string;
  price: number;
  thumbnail: string | null;
}

export interface PayoutMethod {
  id: string;
  label: string;
  holder_name: string;
  masked_number: string;
  bank_name?: string;
  is_active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  percent_off?: number;
  amount_off?: number;
  applies_to: string;
  expires_at?: string | null;
  is_active: boolean;
}
