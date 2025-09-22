import { useState, useEffect } from 'react';
import { candidatesApi } from '../../../api/candidatesApi';
import { jobsApi } from '../../../api/jobsApi';
import { localAssessmentsApi } from '../../../api/localAssessmentsApi';
import type { Candidate, Job } from '../../../db';
import { db } from '../../../db';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { generateSeedData } from '../../../utils/generateSeedData';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  BriefcaseIcon, 
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalCandidates: number;
  totalJobs: number;
  totalAssessments: number;
  activeJobs: number;
  candidatesByStage: {
    applied: number;
    screen: number;
    tech: number;
    offer: number;
    hired: number;
    rejected: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'candidate' | 'job' | 'assessment';
    title: string;
    timestamp: number;
  }>;
}

const STAGE_COLORS = {
  applied: '#3B82F6',
  screen: '#F59E0B',
  tech: '#8B5CF6',
  offer: '#10B981',
  hired: '#059669',
  rejected: '#EF4444'
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Dashboard: Starting data fetch...');
      
      // Fetch all data in parallel - using the same parameters as the working pages
      console.log('🔍 Dashboard: Fetching candidates...');
      const candidatesResponse = await candidatesApi.getCandidates({ 
        search: '', 
        stage: '', 
        page: 1, 
        pageSize: 1000 
      });
      console.log('🔍 Dashboard: Candidates response:', candidatesResponse);
      
      console.log('🔍 Dashboard: Fetching jobs...');
      const jobsResponse = await jobsApi.getJobs({ 
        search: '', 
        status: '', 
        sort: 'order' 
      }, { 
        page: 1, 
        pageSize: 1000 
      });
      console.log('🔍 Dashboard: Jobs response:', jobsResponse);
      
      console.log('🔍 Dashboard: Fetching assessments...');
      const assessmentsData = await localAssessmentsApi.getAllAssessments();
      console.log('🔍 Dashboard: Assessments response:', assessmentsData);

      const candidatesData = candidatesResponse.data || [];
      const jobsData = jobsResponse.data || [];

      console.log('🔍 Dashboard: Processing data - candidates:', candidatesData.length, 'jobs:', jobsData.length, 'assessments:', assessmentsData.length);

      // Calculate stats
      const candidatesByStage = candidatesData.reduce((acc: Record<string, number>, candidate: Candidate) => {
        acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
        return acc;
      }, {});

      const activeJobs = jobsData.filter((job: Job) => job.status === 'active').length;

      // Create recent activity
      const recentActivity = [
        ...candidatesData.slice(0, 3).map((c: Candidate) => ({
          id: c.id.toString(),
          type: 'candidate' as const,
          title: `${c.name} applied for position`,
          timestamp: c.createdAt
        })),
        ...jobsData.slice(0, 2).map((j: Job) => ({
          id: j.id.toString(),
          type: 'job' as const,
          title: `${j.title} position posted`,
          timestamp: j.createdAt
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

      const statsData = {
        totalCandidates: candidatesData.length,
        totalJobs: jobsData.length,
        totalAssessments: assessmentsData.length,
        activeJobs,
        candidatesByStage: {
          applied: candidatesByStage.applied || 0,
          screen: candidatesByStage.screen || 0,
          tech: candidatesByStage.tech || 0,
          offer: candidatesByStage.offer || 0,
          hired: candidatesByStage.hired || 0,
          rejected: candidatesByStage.rejected || 0,
        },
        recentActivity
      };

      console.log('🔍 Dashboard: Final stats:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ Dashboard: Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };  const handleGenerateData = async () => {
    try {
      setIsGenerating(true);
      await generateSeedData();
      toast.success('Seed data generated successfully!');
      await fetchDashboardData();
    } catch (error) {
      console.error('Error generating seed data:', error);
      toast.error('Failed to generate seed data');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      
      // Clear all data from IndexedDB directly (same as generateSeedData does)
      console.log('🗑️ Dashboard: Clearing all data...');
      await db.jobs.clear();
      await db.candidates.clear();
      await db.assessments.clear();
      await db.candidateResponses.clear();
      console.log('✅ Dashboard: All data cleared from IndexedDB');
      
      toast.success('All data cleared successfully!');
      await fetchDashboardData();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 flex items-center justify-center relative overflow-hidden">
        {/* Geometric background */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dashboard-loading-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="2" fill="currentColor" className="text-blue-400" opacity="0.6"/>
                <circle cx="0" cy="0" r="1" fill="currentColor" className="text-purple-400" opacity="0.4"/>
                <circle cx="100" cy="0" r="1" fill="currentColor" className="text-pink-400" opacity="0.4"/>
                <circle cx="0" cy="100" r="1" fill="currentColor" className="text-blue-400" opacity="0.4"/>
                <circle cx="100" cy="100" r="1" fill="currentColor" className="text-purple-400" opacity="0.4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dashboard-loading-pattern)"/>
          </svg>
        </div>
        
        <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl p-12 shadow-2xl border border-white/30 dark:border-slate-700/50">
          <LoadingSpinner size="lg" />
          <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-300">Loading dashboard analytics...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This may take a moment...</p>
        </div>
      </div>
    );
  }

  // Show basic content even without stats
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 relative overflow-hidden">
      {/* Animated geometric background */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dashboard-geometric-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="2" fill="currentColor" className="text-blue-400 dark:text-blue-500" opacity="0.5"/>
              <circle cx="0" cy="0" r="1.5" fill="currentColor" className="text-purple-400 dark:text-purple-500" opacity="0.4"/>
              <circle cx="120" cy="0" r="1.5" fill="currentColor" className="text-pink-400 dark:text-pink-500" opacity="0.4"/>
              <circle cx="0" cy="120" r="1.5" fill="currentColor" className="text-blue-400 dark:text-blue-500" opacity="0.4"/>
              <circle cx="120" cy="120" r="1.5" fill="currentColor" className="text-purple-400 dark:text-purple-500" opacity="0.4"/>
              <path d="M60,0 L120,60 L60,120 L0,60 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-300 dark:text-blue-600" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dashboard-geometric-pattern)"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-slate-700/50 mb-8 p-8 hover:shadow-3xl transition-all duration-700 relative overflow-hidden">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-blue-50/20 to-purple-50/20 dark:from-slate-700/20 dark:via-slate-600/20 dark:to-slate-500/20 rounded-3xl"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                TalentFlow Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Comprehensive analytics and insights for your hiring pipeline
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGenerateData}
                disabled={isGenerating}
                className="inline-flex items-center px-6 py-3 bg-blue-500/80 dark:bg-blue-600/80 backdrop-blur-md border border-white/30 dark:border-slate-600/50 shadow-xl text-white font-semibold rounded-2xl hover:bg-blue-600/90 dark:hover:bg-blue-700/90 hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                {isGenerating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <PlusIcon className="h-5 w-5 mr-2" />
                )}
                Generate Seed Data
              </button>
              
              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="inline-flex items-center px-6 py-3 bg-red-500/80 dark:bg-red-600/80 backdrop-blur-md border border-white/30 dark:border-slate-600/50 shadow-xl text-white font-semibold rounded-2xl hover:bg-red-600/90 dark:hover:bg-red-700/90 hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                {isClearing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <TrashIcon className="h-5 w-5 mr-2" />
                )}
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        {!stats ? (
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/60 p-12 text-center">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ChartBarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium">No Data Available</p>
              <p className="text-sm mt-2">Generate seed data to see analytics and insights</p>
              <button
                onClick={handleGenerateData}
                disabled={isGenerating}
                className="mt-6 inline-flex items-center px-6 py-3 bg-blue-500/80 dark:bg-blue-600/80 backdrop-blur-md border border-white/30 dark:border-slate-600/50 shadow-xl text-white font-semibold rounded-2xl hover:bg-blue-600/90 dark:hover:bg-blue-700/90 hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                {isGenerating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <PlusIcon className="h-5 w-5 mr-2" />
                )}
                Get Started with Sample Data
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Prepare chart data */}
            {(() => {
              const stageData = Object.entries(stats.candidatesByStage).map(([stage, count]) => ({
                stage: stage.charAt(0).toUpperCase() + stage.slice(1),
                count,
                color: STAGE_COLORS[stage as keyof typeof STAGE_COLORS]
              }));

              const pieData = stageData.filter(item => item.count > 0);

              return (
                <>
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Candidates */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/40 dark:border-slate-700/60 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl"></div>
            <div className="relative z-10 flex items-center">
              <div className="p-3 bg-blue-500/20 dark:bg-blue-600/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-blue-500/30">
                <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCandidates}</p>
              </div>
            </div>
          </div>

          {/* Total Jobs */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/40 dark:border-slate-700/60 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl"></div>
            <div className="relative z-10 flex items-center">
              <div className="p-3 bg-purple-500/20 dark:bg-purple-600/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-purple-500/30">
                <BriefcaseIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Jobs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeJobs}</p>
              </div>
            </div>
          </div>

          {/* Total Assessments */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/40 dark:border-slate-700/60 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-2xl"></div>
            <div className="relative z-10 flex items-center">
              <div className="p-3 bg-green-500/20 dark:bg-green-600/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-green-500/30">
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assessments</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAssessments}</p>
              </div>
            </div>
          </div>

          {/* Hired Candidates */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/40 dark:border-slate-700/60 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-2xl"></div>
            <div className="relative z-10 flex items-center">
              <div className="p-3 bg-emerald-500/20 dark:bg-emerald-600/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-emerald-500/30">
                <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hired</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.candidatesByStage.hired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hiring Pipeline Chart */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/60 p-8 hover:shadow-3xl transition-all duration-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-blue-50/15 to-purple-50/15 dark:from-slate-700/15 dark:via-slate-600/15 dark:to-slate-500/15 rounded-3xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                Hiring Pipeline
              </h3>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                  <XAxis 
                    dataKey="stage" 
                    stroke="rgba(148, 163, 184, 0.8)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgba(148, 163, 184, 0.8)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Candidate Distribution Pie Chart */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/60 p-8 hover:shadow-3xl transition-all duration-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-purple-50/15 to-pink-50/15 dark:from-slate-700/15 dark:via-slate-600/15 dark:to-slate-500/15 rounded-3xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <EyeIcon className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
                Candidate Distribution
              </h3>
              
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    label={({ stage, count }) => `${stage}: ${count}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/60 p-8 hover:shadow-3xl transition-all duration-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-green-50/15 to-blue-50/15 dark:from-slate-700/15 dark:via-slate-600/15 dark:to-slate-500/15 rounded-3xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <ClockIcon className="h-6 w-6 mr-3 text-green-600 dark:text-green-400" />
              Recent Activity
            </h3>
            
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 bg-white/50 dark:bg-slate-700/50 backdrop-blur-lg rounded-xl p-4 border border-white/30 dark:border-slate-600/40 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className={`p-2 rounded-lg backdrop-blur-sm border border-white/20 ${
                    activity.type === 'candidate' 
                      ? 'bg-blue-500/20 dark:bg-blue-600/20' 
                      : activity.type === 'job'
                      ? 'bg-purple-500/20 dark:bg-purple-600/20'
                      : 'bg-green-500/20 dark:bg-green-600/20'
                  }`}>
                    {activity.type === 'candidate' ? (
                      <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : activity.type === 'job' ? (
                      <BriefcaseIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {stats.recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No recent activity</p>
                  <p className="text-sm mt-2">Activity will appear here as you use the system</p>
                </div>
              )}
            </div>
          </div>
        </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}