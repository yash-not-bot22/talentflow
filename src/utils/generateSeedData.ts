import type { Job, Candidate, Assessment, Section } from '../db';
import { db } from '../db';
import { generateUniqueSlug } from './helpers';

const JOB_TITLES = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Product Manager',
  'UX Designer',
  'QA Engineer',
  'Mobile Developer',
  'Machine Learning Engineer',
  'Security Engineer',
  'Cloud Architect',
  'Technical Writer',
  'Engineering Manager',
  'Sales Engineer',
  'Customer Success Manager',
  'Marketing Manager',
  'Business Analyst',
  'Scrum Master',
  'Site Reliability Engineer',
  'Database Administrator',
  'Systems Administrator',
  'Network Engineer',
  'Technical Support Engineer',
  'Content Manager'
];

const TAGS = [
  'remote', 'hybrid', 'onsite', 'senior', 'junior', 'mid-level',
  'startup', 'enterprise', 'fintech', 'healthcare', 'edtech',
  'react', 'angular', 'vue', 'nodejs', 'python', 'java',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'agile'
];

const FIRST_NAMES = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Anna',
  'Robert', 'Lisa', 'James', 'Maria', 'William', 'Jennifer', 'Richard', 'Linda',
  'Thomas', 'Patricia', 'Daniel', 'Elizabeth', 'Matthew', 'Susan', 'Anthony', 'Jessica',
  'Mark', 'Karen', 'Donald', 'Nancy', 'Steven', 'Betty', 'Paul', 'Helen',
  'Andrew', 'Sandra', 'Joshua', 'Donna', 'Kenneth', 'Carol', 'Kevin', 'Ruth',
  'Brian', 'Sharon', 'George', 'Michelle', 'Edward', 'Laura', 'Ronald', 'Sarah',
  'Timothy', 'Kimberly', 'Jason', 'Deborah', 'Jeffrey', 'Dorothy', 'Ryan', 'Lisa'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
];

const STAGES: Candidate['stage'][] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomName(): string {
  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  return `${firstName} ${lastName}`;
}

function generateRandomEmail(name: string): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'example.com'];
  return `${cleanName}@${getRandomElement(domains)}`;
}

export async function generateSeedData(): Promise<void> {
  try {
    console.log('Starting seed data generation...');

    // Clear existing data
    await db.transaction('rw', [db.jobs, db.candidates, db.assessments, db.candidateResponses], async () => {
      await db.jobs.clear();
      await db.candidates.clear();
      await db.assessments.clear();
      await db.candidateResponses.clear();
    });

    // Generate 25 jobs
    const jobs: Omit<Job, 'id'>[] = [];
    const existingSlugs: string[] = [];

    for (let i = 0; i < 25; i++) {
      const title = getRandomElement(JOB_TITLES);
      const slug = generateUniqueSlug(title, existingSlugs);
      existingSlugs.push(slug);

      const job: Omit<Job, 'id'> = {
        title,
        slug,
        status: Math.random() > 0.3 ? 'active' : 'archived', // 70% active, 30% archived
        tags: getRandomElements(TAGS, Math.floor(Math.random() * 4) + 1), // 1-4 tags
        order: i + 1,
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random time in last 30 days
        updatedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time in last 7 days
      };
      jobs.push(job);
    }

    // Insert jobs and get their IDs
    const jobIds = await db.jobs.bulkAdd(jobs as Job[], { allKeys: true });
    console.log(`Generated ${jobIds.length} jobs`);

    // Generate 1000 candidates
    const candidates: Omit<Candidate, 'id'>[] = [];
    for (let i = 0; i < 1000; i++) {
      const name = generateRandomName();
      const email = generateRandomEmail(name);
      const jobId = getRandomElement(jobIds) as number;
      const stage = getRandomElement(STAGES);
      const createdAt = Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000; // Random time in last 60 days

      const candidate: Omit<Candidate, 'id'> = {
        name,
        email,
        jobId,
        stage,
        history: [
          { stage: 'applied', timestamp: createdAt },
          ...(stage !== 'applied' ? [{ stage, timestamp: createdAt + Math.random() * 14 * 24 * 60 * 60 * 1000 }] : [])
        ],
        notes: [],
        createdAt,
      };
      candidates.push(candidate);
    }

    await db.candidates.bulkAdd(candidates as Candidate[]);
    console.log(`Generated ${candidates.length} candidates`);

    // Generate 3 assessments for random jobs
    const selectedJobIds = getRandomElements(jobIds.slice(0, 3), 3) as number[];
    
    for (const jobId of selectedJobIds) {
      const assessment = generateSampleAssessment(jobId);
      await db.assessments.put(assessment);
    }

    console.log(`Generated ${selectedJobIds.length} assessments`);
    console.log('Seed data generation completed successfully!');
  } catch (error) {
    console.error('Failed to generate seed data:', error);
    throw error;
  }
}

function generateSampleAssessment(jobId: number): Assessment {
  const sections: Section[] = [
    {
      id: crypto.randomUUID(),
      name: 'Technical Skills',
      questions: [
        {
          id: crypto.randomUUID(),
          type: 'single-choice',
          text: 'What is your primary programming language?',
          options: ['JavaScript', 'Python', 'Java', 'TypeScript', 'Go', 'Rust'],
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'multi-choice',
          text: 'Which frameworks have you worked with? (Select all that apply)',
          options: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask'],
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'numeric',
          text: 'How many years of professional experience do you have?',
          min: 0,
          max: 50,
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'short-text',
          text: 'What is your favorite development tool?',
          maxLength: 100,
          required: false,
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Problem Solving',
      questions: [
        {
          id: crypto.randomUUID(),
          type: 'long-text',
          text: 'Describe a challenging technical problem you solved recently and your approach.',
          maxLength: 1000,
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'single-choice',
          text: 'When debugging, what is your first step?',
          options: [
            'Read error messages carefully',
            'Add console.log statements',
            'Use a debugger',
            'Search Stack Overflow',
            'Ask a colleague'
          ],
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'file-upload',
          text: 'Upload your portfolio or code samples (optional)',
          required: false,
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Cultural Fit',
      questions: [
        {
          id: crypto.randomUUID(),
          type: 'single-choice',
          text: 'Do you prefer working in a team or independently?',
          options: ['Team', 'Independently', 'Both equally'],
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'long-text',
          text: 'What motivates you in your work?',
          maxLength: 500,
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'single-choice',
          text: 'Are you interested in remote work?',
          options: ['Yes', 'No', 'Hybrid preferred'],
          required: true,
        },
      ],
    },
  ];

  return {
    jobId,
    sections,
    updatedAt: Date.now(),
  };
}