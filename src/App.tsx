import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { db } from './db';
import { DatabaseStatus } from './components/DatabaseStatus';
import { JobsBoard } from './features/jobs/pages/JobsBoard';

// Placeholder components - we'll implement these later
const JobDetails = () => <div className="p-8">Job Details - Coming Soon</div>;
const CandidatesPage = () => <div className="p-8">Candidates - Coming Soon</div>;
const CandidateProfile = () => <div className="p-8">Candidate Profile - Coming Soon</div>;
const AssessmentsPage = () => <div className="p-8">Assessments - Coming Soon</div>;

function App() {
  useEffect(() => {
    // Initialize database on app start
    const initializeDatabase = async () => {
      try {
        console.log('🔧 Initializing database...');
        await db.open();
        console.log('✅ Database opened successfully');
        
        // Check if tables have data
        const jobCount = await db.jobs.count();
        const candidateCount = await db.candidates.count();
        console.log(`📊 Database contains ${jobCount} jobs and ${candidateCount} candidates`);
        
        // If no data, generate seed data
        if (jobCount === 0) {
          console.log('🌱 No data found, generating seed data...');
          const { generateSeedData } = await import('./utils/generateSeedData');
          await generateSeedData();
          console.log('✅ Seed data generated successfully');
        }
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
      }
    };
    
    initializeDatabase();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TF</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">TalentFlow</h1>
                </div>
              </div>
              <div className="flex space-x-1">
                <a href="/jobs" className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Jobs
                </a>
                <a href="/candidates" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Candidates
                </a>
                <a href="/assessments" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
