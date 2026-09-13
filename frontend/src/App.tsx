import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Learn = lazy(() => import("./pages/Learn"));
const Tracks = lazy(() => import("./pages/Tracks"));
const TrackDetail = lazy(() => import("./pages/TrackDetail"));
const Books = lazy(() => import("./pages/Books"));
const Projects = lazy(() => import("./pages/Projects"));
const Community = lazy(() => import("./pages/Community"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Certificates = lazy(() => import("./pages/Certificates"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Profile = lazy(() => import("./pages/Profile"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const Help = lazy(() => import("./pages/Help"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const InstructorLayout = lazy(() => import("./pages/instructor/InstructorLayout"));
const InstructorDashboard = lazy(() => import("./pages/instructor/InstructorDashboard"));
const CreateCourse = lazy(() => import("./pages/instructor/CreateCourse"));
const CourseCurriculum = lazy(() => import("./pages/instructor/CourseCurriculum"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminInstructors = lazy(() => import("./pages/admin/AdminInstructors"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminPaths = lazy(() => import("./pages/admin/AdminPaths"));
const AdminBooks = lazy(() => import("./pages/admin/AdminBooks"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminCertificates = lazy(() => import("./pages/admin/AdminCertificates"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminFinancials = lazy(() => import("./pages/admin/AdminFinancials"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

function PageFallback() {
  return <div className="flex min-h-[50vh] items-center justify-center text-muted">...</div>;
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="tracks" element={<Tracks />} />
          <Route path="tracks/:id" element={<TrackDetail />} />
          <Route path="books" element={<Books />} />
          <Route path="projects" element={<Projects />} />
          <Route path="community" element={<Community />} />
          <Route path="community/:id" element={<PostDetail />} />
          <Route path="verify" element={<VerifyCertificate />} />
          <Route path="verify/:code" element={<VerifyCertificate />} />
          <Route path="contact" element={<Contact />} />
          <Route path="help" element={<Help />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />

          <Route
            path="course/:id/learn"
            element={
              <ProtectedRoute>
                <Learn />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="certificates"
            element={
              <ProtectedRoute>
                <Certificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="instructor"
          element={
            <ProtectedRoute roles={["instructor", "admin"]}>
              <InstructorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InstructorDashboard />} />
          <Route path="courses/new" element={<CreateCourse />} />
          <Route path="courses/:id/edit" element={<CreateCourse />} />
          <Route path="courses/:id/curriculum" element={<CourseCurriculum />} />
        </Route>

        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="instructors" element={<AdminInstructors />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="courses/new" element={<CreateCourse />} />
          <Route path="courses/:id/edit" element={<CreateCourse />} />
          <Route path="courses/:id/curriculum" element={<CourseCurriculum />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="paths" element={<AdminPaths />} />
          <Route path="books" element={<AdminBooks />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="certificates" element={<AdminCertificates />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="financials" element={<AdminFinancials />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
