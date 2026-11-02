import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminOverview from './pages/AdminOverview';
import AdminUsers from './pages/AdminUsers';
import TeacherPortal from './pages/TeacherPortal';
import StudentPortal from './pages/StudentPortal';
import NotFound from './pages/NotFound';

/**
 * Root Application Router
 * Configured with Milestone 2, Teacher Studio & Student Practice Studio routes:
 * - / (Landing)
 * - /login/student, /login/teacher, /login/admin
 * - /signup/student, /signup/teacher
 * - /student/practice, /student/dashboard, /student/tests, /student/results
 * - /dashboard/student
 * - /teacher/create-test, /teacher/tests, /teacher/dashboard, /teacher/students
 * - /admin/overview & /admin/dashboard & /dashboard/admin (Platform Overview Console)
 * - /admin/users (Institutional Users & Approvals Console)
 * - * (404 Not Found)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Login Routes for each role */}
        <Route path="/login/student" element={<Login roleOverride="student" />} />
        <Route path="/login/teacher" element={<Login roleOverride="teacher" />} />
        <Route path="/login/admin" element={<Login roleOverride="admin" />} />

        {/* Signup Routes (Students & Teachers only; Admin has NO signup page) */}
        <Route path="/signup/student" element={<Signup roleOverride="student" />} />
        <Route path="/signup/teacher" element={<Signup roleOverride="teacher" />} />
        <Route path="/signup/admin" element={<Navigate to="/login/admin" replace />} />

        {/* Dynamic fallback for /login and /signup */}
        <Route path="/login" element={<Navigate to="/login/student" replace />} />
        <Route path="/signup" element={<Navigate to="/signup/student" replace />} />

        {/* Student Practice Studio & Learning Portal Routes */}
        <Route path="/student/practice" element={<StudentPortal initialView="practice" />} />
        <Route path="/student/dashboard" element={<StudentPortal initialView="dashboard" />} />
        <Route path="/student/tests" element={<StudentPortal initialView="tests" />} />
        <Route path="/student/results" element={<StudentPortal initialView="results" />} />
        <Route path="/student" element={<Navigate to="/student/practice" replace />} />
        <Route path="/dashboard/student" element={<StudentPortal initialView="practice" />} />

        {/* Teacher Studio & Assessment Authoring Routes */}
        <Route path="/teacher/create-test" element={<TeacherPortal initialView="create-test" />} />
        <Route path="/teacher/tests" element={<TeacherPortal initialView="tests" />} />
        <Route path="/teacher/dashboard" element={<TeacherPortal initialView="dashboard" />} />
        <Route path="/teacher/students" element={<TeacherPortal initialView="students" />} />
        <Route path="/teacher" element={<Navigate to="/teacher/create-test" replace />} />
        <Route path="/dashboard/teacher" element={<TeacherPortal initialView="create-test" />} />

        {/* Admin Overview & Management Routes */}
        <Route path="/admin/overview" element={<AdminOverview />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/dashboard/admin" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />

        {/* Dynamic role dashboard route fallback */}
        <Route path="/dashboard/:role" element={<Dashboard />} />

        {/* 404 Catch-All Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}


