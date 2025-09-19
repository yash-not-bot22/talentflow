import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { db } from './db';
import { DatabaseStatus } from './components/DatabaseStatus';

// Placeholder components - we'll implement these later
const JobsBoard = () => <div className="p-8">Jobs Board - Coming Soon</div>;
const JobDetails = () => <div className="p-8">Job Details - Coming Soon</div>;
const CandidatesPage = () => <div className="p-8">Candidates - Coming Soon</div>;
const CandidateProfile = () => <div className="p-8">Candidate Profile - Coming Soon</div>;
const AssessmentsPage = () => <div className="p-8">Assessments - Coming Soon</div>;

function App() {
  useEffect(() => {
    // Initialize database on app start
    db.open().then(() => {
      console.log('Database initialized successfully');
    }).catch((error) => {
      console.error('Failed to initialize database:', error);
    });
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">TalentFlow</h1>
              </div>
              <div className="flex space-x-8">
                <a href="/jobs" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Jobs
                </a>
                <a href="/candidates" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Candidates
                </a>
                <a href="/assessments" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Assessments
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DatabaseStatus />
            <Routes>
              <Route path="/" element={<Navigate to="/jobs" replace />} />
              <Route path="/jobs" element={<JobsBoard />} />
              <Route path="/jobs/:jobId" element={<JobDetails />} />
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/candidates/:id" element={<CandidateProfile />} />
              <Route path="/assessments" element={<AssessmentsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App
