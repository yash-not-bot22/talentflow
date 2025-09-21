import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { db } from './db';
import { DatabaseStatus } from './components/DatabaseStatus';
import { JobsBoard } from './features/jobs/pages/JobsBoard';
import { JobDetails } from './features/jobs/pages/JobDetails';

// Import candidate components
import { CandidatesPage } from './features/candidates/pages/CandidatesPage';
import { SimpleCandidatesPage } from './features/candidates/pages/SimpleCandidatesPage';
import { CandidateProfile } from './features/candidates/pages/CandidateProfile';
import { DebugCandidates } from './components/DebugCandidates';
import { AssessmentBuilder } from './features/assessments/components/AssessmentBuilder';
import { AssessmentDetail } from './features/assessments/pages/AssessmentDetail';
import { CandidateResponseDetail } from './features/assessments/pages/CandidateResponseDetail';

// Navigation component with active state
function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/jobs', label: 'Jobs', icon: '💼' },
    { path: '/candidates', label: 'Candidates', icon: '👥' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">TF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TalentFlow
                </h1>
                <p className="text-xs text-gray-500">Talent Management System</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive(item.path) 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

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
        <Navigation />

        {/* Main Content */}
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DatabaseStatus />
            <Routes>
              <Route path="/" element={<Navigate to="/jobs" replace />} />
              <Route path="/jobs" element={<JobsBoard />} />
              <Route path="/jobs/:jobId" element={<JobDetails />} />
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/candidates-simple" element={<SimpleCandidatesPage />} />
              <Route path="/candidates/:id" element={<CandidateProfile />} />
              <Route path="/assessment/:jobId" element={<AssessmentDetail />} />
              <Route path="/assessment/:jobId/edit" element={<AssessmentBuilder />} />
              <Route path="/assessment/:jobId/response/:responseId" element={<CandidateResponseDetail />} />
              <Route path="/debug" element={<DebugCandidates />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
