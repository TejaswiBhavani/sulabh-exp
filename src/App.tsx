import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ComplaintProvider } from './contexts/ComplaintContext'
import { SuggestionProvider } from './contexts/SuggestionContext'
import { ReportsProvider } from './contexts/ReportsContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { FileUploadProvider } from './contexts/FileUploadContext'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import DashboardPage from './pages/DashboardPage'
import SubmitComplaintPage from './pages/SubmitComplaintPage'
import SubmitSuggestionPage from './pages/SubmitSuggestionPage'
import SuggestionsPage from './pages/SuggestionsPage'
import SuggestionDetailsPage from './pages/SuggestionDetailsPage'
import NGODashboardPage from './pages/NGODashboardPage'
import NGOCampaignPage from './pages/NGOCampaignPage'
import TrackComplaintPage from './pages/TrackComplaintPage'
import ComplaintDetailsPage from './pages/ComplaintDetailsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AuthorityDashboardPage from './pages/AuthorityDashboardPage'
import EnhancedReportsPage from './pages/EnhancedReportsPage'
import UserSettingsPage from './pages/UserSettingsPage'
import TestSuite from './components/Testing/TestSuite'
import PerformanceMonitor from './components/Performance/PerformanceMonitor'
import AccessibilityChecker from './components/Accessibility/AccessibilityChecker'
import ProtectedRoute from './components/Auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <FileUploadProvider>
          <ComplaintProvider>
            <SuggestionProvider>
              <ReportsProvider>
                <Router>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />
                      <Route path="/track" element={<TrackComplaintPage />} />
                      <Route path="/suggestions" element={<SuggestionsPage />} />
                      <Route path="/suggestion/:id" element={<SuggestionDetailsPage />} />
                      <Route path="/complaint/:id" element={<ComplaintDetailsPage />} />
                      
                      {/* Testing and Development Routes */}
                      <Route path="/test-suite" element={<TestSuite />} />
                      <Route path="/performance" element={<PerformanceMonitor />} />
                      <Route path="/accessibility" element={<AccessibilityChecker />} />
                      
                      {/* Protected Routes */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <UserSettingsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/submit-complaint" element={
                        <ProtectedRoute>
                          <SubmitComplaintPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/submit-suggestion" element={
                        <ProtectedRoute>
                          <SubmitSuggestionPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/ngo" element={
                        <ProtectedRoute requiredRole="ngo">
                          <NGODashboardPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/ngo/campaign/:id" element={
                        <ProtectedRoute requiredRole="ngo">
                          <NGOCampaignPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <ProtectedRoute requiredRole="authority">
                          <EnhancedReportsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin" element={
                        <ProtectedRoute requiredRole="admin">
                          <AdminDashboardPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/reports" element={
                        <ProtectedRoute requiredRole="admin">
                          <EnhancedReportsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/authority" element={
                        <ProtectedRoute requiredRole="authority">
                          <AuthorityDashboardPage />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </Layout>
                </Router>
              </ReportsProvider>
            </SuggestionProvider>
          </ComplaintProvider>
        </FileUploadProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App