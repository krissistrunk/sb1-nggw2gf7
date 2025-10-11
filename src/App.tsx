import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SeedUsersPage } from './pages/SeedUsersPage';
import { TodayPage } from './pages/TodayPage';
import { OutcomesPage } from './pages/OutcomesPage';
import { AreasPage } from './pages/AreasPage';
import { InboxPage } from './pages/InboxPage';
import { CapturePage } from './pages/CapturePage';
import { DailyPlanningPage } from './pages/DailyPlanningPage';
import { EveningReviewPage } from './pages/EveningReviewPage';
import { OutcomeDetailPage } from './pages/OutcomeDetailPage';
import { LifePlanPage } from './pages/LifePlanPage';
import { GoalsPage } from './pages/GoalsPage';
import { WeeklyReviewPage } from './pages/WeeklyReviewPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { MonthlyReviewPage } from './pages/MonthlyReviewPage';
import { WeeklyPlanPage } from './pages/WeeklyPlanPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <OrganizationProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/seed-users" element={<SeedUsersPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/today" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/today"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TodayPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/outcomes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <OutcomesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/outcomes/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <OutcomeDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/areas"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AreasPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InboxPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/capture"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CapturePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/daily-planning"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DailyPlanningPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/evening-review"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EveningReviewPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/life-plan"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LifePlanPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GoalsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/weekly-review"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <WeeklyReviewPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TemplatesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/monthly-review"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MonthlyReviewPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/weekly-plan"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <WeeklyPlanPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/week"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <WeeklyPlanPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </OrganizationProvider>
    </BrowserRouter>
  );
}

export default App;
