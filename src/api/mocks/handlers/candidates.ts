import { http, HttpResponse } from 'msw';
import { db } from '../../../db';
import type { Candidate } from '../../../db';

// Helper function to simulate network delays
const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));

// Helper function to simulate errors (7.5% chance)
const shouldError = () => Math.random() < 0.075;

// Helper function to validate stage transitions
const isValidStageTransition = (currentStage: Candidate['stage'], newStage: Candidate['stage']): boolean => {
  // Allow moving to 'rejected' from any stage
  if (newStage === 'rejected') return true;
  
  // Define stage order for progression
  const stageOrder: Candidate['stage'][] = ['applied', 'screen', 'tech', 'offer', 'hired'];
  
  const currentIndex = stageOrder.indexOf(currentStage);
  const newIndex = stageOrder.indexOf(newStage);
  
  // Allow forward movement (including skipping stages) and staying in the same stage
  return newIndex >= currentIndex;
};

export const candidatesHandlers = [
  // GET /candidates?search=&stage=&page=
  http.get('/api/candidates', async ({ request }) => {

    try {
      console.log('🔍 GET /candidates - Starting handler...');
      
      // Ensure database is open
      if (!db.isOpen()) {
        console.log('📂 Database not open, opening...');
        await db.open();
      }
      
      const url = new URL(request.url);
      const search = url.searchParams.get('search') || '';
      const stage = url.searchParams.get('stage') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

      console.log('🔍 GET /candidates with filters:', { search, stage, page, pageSize });

      console.log('🔍 GET /candidates - Executing database query...');
      let candidates = await db.candidates.toArray();
      console.log('🔍 GET /candidates - Database query returned', candidates.length, 'candidates');
      
      // Sort by createdAt in memory since it might not be indexed
      candidates.sort((a, b) => b.createdAt - a.createdAt);

      // Apply search filter (name or email)
      if (search) {
        const searchLower = search.toLowerCase();
        candidates = candidates.filter(candidate => 
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.email.toLowerCase().includes(searchLower)
        );
      }

      // Apply stage filter
      if (stage) {
        candidates = candidates.filter(candidate => candidate.stage === stage);
      }

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCandidates = candidates.slice(startIndex, endIndex);

      const response = {
        data: paginatedCandidates,
        pagination: {
          page,
          pageSize,
          totalCount: candidates.length,
          totalPages: Math.ceil(candidates.length / pageSize),
        },
        filters: { search, stage }
      };

      console.log('✅ Returning', paginatedCandidates.length, 'candidates');
      return HttpResponse.json(response);
    } catch (error) {
      console.error('❌ Error in GET /candidates:', error);
      return new HttpResponse(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),

  // POST /candidates
  http.post('/api/candidates', async ({ request }) => {
    await delay();
    
    if (shouldError()) {
      return new HttpResponse(
        JSON.stringify({ error: 'Failed to create candidate' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.json() as {
        name: string;
        email: string;
        jobId: number;
        stage?: Candidate['stage'];
      };

      console.log('➕ POST /candidates with data:', body);

      // Validate required fields
      if (!body.name || !body.email || !body.jobId) {
        return new HttpResponse(
          JSON.stringify({ error: 'Missing required fields: name, email, jobId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if job exists
      const job = await db.jobs.get(body.jobId);
      if (!job) {
        return new HttpResponse(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check for duplicate email
      const existingCandidate = await db.candidates.where('email').equals(body.email).first();
      if (existingCandidate) {
        return new HttpResponse(
          JSON.stringify({ error: 'Candidate with this email already exists' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const now = Date.now();
      const initialStage = body.stage || 'applied';

      const newCandidate: Candidate = {
        id: 0, // Will be auto-generated by Dexie
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        jobId: body.jobId,
        stage: initialStage,
        history: [{ stage: initialStage, timestamp: now }],
        notes: [],
        createdAt: now,
      };

      const id = await db.candidates.add(newCandidate);
      const createdCandidate = await db.candidates.get(id);

      console.log('✅ Created candidate:', createdCandidate);
      return HttpResponse.json(createdCandidate, { status: 201 });
    } catch (error) {
      console.error('❌ Error in POST /candidates:', error);
      return new HttpResponse(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),

  // PATCH /candidates/:id (stage transitions)
  http.patch('/api/candidates/:id', async ({ request, params }) => {
    await delay();
    
    if (shouldError()) {
      return new HttpResponse(
        JSON.stringify({ error: 'Failed to update candidate' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const candidateId = parseInt(params.id as string);
      const body = await request.json() as {
        stage?: Candidate['stage'];
        notes?: string;
      };

      console.log('📝 PATCH /candidates/' + candidateId + ' with data:', body);

      if (isNaN(candidateId)) {
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid candidate ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const candidate = await db.candidates.get(candidateId);
      if (!candidate) {
        return new HttpResponse(
          JSON.stringify({ error: 'Candidate not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const updates: Partial<Candidate> = {};
      const now = Date.now();

      // Handle stage transition
      if (body.stage && body.stage !== candidate.stage) {
        if (!isValidStageTransition(candidate.stage, body.stage)) {
          return new HttpResponse(
            JSON.stringify({ 
              error: `Invalid stage transition from '${candidate.stage}' to '${body.stage}'` 
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        updates.stage = body.stage;
        updates.history = [
          ...candidate.history,
          { stage: body.stage, timestamp: now }
        ];
      }

      // Handle notes addition
      if (body.notes && body.notes.trim()) {
        updates.notes = [
          ...candidate.notes,
          { text: body.notes.trim(), timestamp: now }
        ];
      }

      if (Object.keys(updates).length === 0) {
        return new HttpResponse(
          JSON.stringify({ error: 'No valid updates provided' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await db.candidates.update(candidateId, updates);
      const updatedCandidate = await db.candidates.get(candidateId);

      console.log('✅ Updated candidate:', updatedCandidate);
      return HttpResponse.json(updatedCandidate);
    } catch (error) {
      console.error('❌ Error in PATCH /candidates/:id:', error);
      return new HttpResponse(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),

  // GET /candidates/:id/timeline
  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await delay();
    
    if (shouldError()) {
      return new HttpResponse(
        JSON.stringify({ error: 'Failed to fetch candidate timeline' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const candidateId = parseInt(params.id as string);

      console.log('📅 GET /candidates/' + candidateId + '/timeline');

      if (isNaN(candidateId)) {
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid candidate ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const candidate = await db.candidates.get(candidateId);
      if (!candidate) {
        return new HttpResponse(
          JSON.stringify({ error: 'Candidate not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Combine history and notes into a timeline
      const timeline = [
        ...candidate.history.map(entry => ({
          type: 'stage_change' as const,
          stage: entry.stage,
          timestamp: entry.timestamp,
        })),
        ...candidate.notes.map(note => ({
          type: 'note' as const,
          text: note.text,
          timestamp: note.timestamp,
        }))
      ].sort((a, b) => a.timestamp - b.timestamp);

      const response = {
        candidateId,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          currentStage: candidate.stage,
        },
        timeline
      };

      console.log('✅ Returning timeline with', timeline.length, 'entries');
      return HttpResponse.json(response);
    } catch (error) {
      console.error('❌ Error in GET /candidates/:id/timeline:', error);
      return new HttpResponse(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),
];