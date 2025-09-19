import { http, HttpResponse, delay } from 'msw';
import type { Job } from '../../../db';
import { db } from '../../../db';
import { generateUniqueSlug } from '../../../utils/helpers';

// Utility function to simulate network latency (200-1200ms)
const randomDelay = () => delay(200 + Math.random() * 1000);

// Utility function to simulate errors (5-10% chance)
const shouldFail = () => Math.random() < 0.075; // 7.5% error rate

// Types for API requests/responses
interface JobsQueryParams {
  search?: string;
  status?: 'active' | 'archived';
  page?: string;
  pageSize?: string;
  sort?: 'title' | 'createdAt' | 'updatedAt' | 'order';
}

interface CreateJobRequest {
  title: string;
  status?: 'active' | 'archived';
  tags?: string[];
  order?: number;
}

interface UpdateJobRequest {
  title?: string;
  status?: 'active' | 'archived';
  tags?: string[];
  order?: number;
}

interface ReorderJobRequest {
  fromOrder: number;
  toOrder: number;
}

export const jobsHandlers = [
  // GET /jobs?search=&status=&page=&pageSize=&sort=
  http.get('/api/jobs', async ({ request }) => {
    await randomDelay();
    
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      console.log('🔍 GET /jobs - Starting handler...');
      
      // Ensure database is open
      if (!db.isOpen()) {
        console.log('📂 Database not open, opening...');
        await db.open();
      }
      
      const url = new URL(request.url);
      const params: JobsQueryParams = {
        search: url.searchParams.get('search') || undefined,
        status: (url.searchParams.get('status') as 'active' | 'archived') || undefined,
        page: url.searchParams.get('page') || '1',
        pageSize: url.searchParams.get('pageSize') || '10',
        sort: (url.searchParams.get('sort') as 'title' | 'createdAt' | 'updatedAt' | 'order') || 'order',
      };

      console.log('🔍 GET /jobs - Query params:', params);

      let query = db.jobs.orderBy(params.sort || 'order');

      // Apply filters
      console.log('🔍 GET /jobs - Executing database query...');
      let jobs = await query.toArray();
      console.log('🔍 GET /jobs - Database query returned', jobs.length, 'jobs');

      if (params.search) {
        const searchLower = params.search.toLowerCase();
        jobs = jobs.filter((job: Job) => 
          job.title.toLowerCase().includes(searchLower) ||
          job.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }

      if (params.status) {
        jobs = jobs.filter((job: Job) => job.status === params.status);
      }

      // Apply pagination
      const page = parseInt(params.page || '1');
      const pageSize = parseInt(params.pageSize || '10');
      const totalCount = jobs.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      const paginatedJobs = jobs.slice(startIndex, endIndex);

      return HttpResponse.json({
        data: paginatedJobs,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return HttpResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }
  }),

  // POST /jobs
  http.post('/api/jobs', async ({ request }) => {
    await randomDelay();
    
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    try {
      const body = await request.json() as CreateJobRequest;
      
      // Validate required fields
      if (!body.title || body.title.trim().length === 0) {
        return HttpResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }

      // Get existing slugs to ensure uniqueness
      const existingJobs = await db.jobs.toArray();
      const existingSlugs = existingJobs.map((job: Job) => job.slug);
      
      // Generate unique slug
      const slug = generateUniqueSlug(body.title, existingSlugs);
      
      // Check if slug already exists (shouldn't happen with generateUniqueSlug, but safety check)
      const existingJob = await db.jobs.where('slug').equals(slug).first();
      if (existingJob) {
        return HttpResponse.json(
          { error: 'Job with this title already exists' },
          { status: 409 }
        );
      }

      // Handle order assignment
      let newOrder: number;
      if (body.order !== undefined) {
        // Validate the provided order
        if (typeof body.order !== 'number' || body.order < 1) {
          return HttpResponse.json(
            { error: 'Order must be a positive integer' },
            { status: 400 }
          );
        }
        
        // Check if the order is already taken
        const existingJobWithOrder = await db.jobs.where('order').equals(body.order).first();
        if (existingJobWithOrder) {
          // Shift existing jobs to make room
          const jobsToShift = await db.jobs.where('order').aboveOrEqual(body.order).toArray();
          for (const job of jobsToShift) {
            await db.jobs.update(job.id, { order: job.order + 1, updatedAt: Date.now() });
          }
        }
        newOrder = body.order;
      } else {
        // Get the highest order number for new job positioning
        const highestOrderJob = await db.jobs.orderBy('order').reverse().first();
        newOrder = (highestOrderJob?.order || 0) + 1;
      }

      const newJob: Omit<Job, 'id'> = {
        title: body.title.trim(),
        slug,
        status: body.status || 'active',
        tags: body.tags || [],
        order: newOrder,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const jobId = await db.jobs.add(newJob as Job);
      const createdJob = await db.jobs.get(jobId);

      return HttpResponse.json(createdJob, { status: 201 });
    } catch (error) {
      console.error('Error creating job:', error);
      return HttpResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }
  }),

  // PATCH /jobs/:id
  http.patch('/api/jobs/:id', async ({ params, request }) => {
    await randomDelay();
    
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      );
    }

    try {
      const jobId = parseInt(params.id as string);
      const body = await request.json() as UpdateJobRequest;
      
      const existingJob = await db.jobs.get(jobId);
      if (!existingJob) {
        return HttpResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      const updates: Partial<Job> = {
        updatedAt: Date.now(),
      };

      // Handle title update (need to regenerate slug if title changes)
      if (body.title !== undefined) {
        if (body.title.trim().length === 0) {
          return HttpResponse.json(
            { error: 'Title is required' },
            { status: 400 }
          );
        }
        
        updates.title = body.title.trim();
        
        // Only regenerate slug if title actually changed
        if (body.title.trim() !== existingJob.title) {
          const otherJobs = await db.jobs.where('id').notEqual(jobId).toArray();
          const existingSlugs = otherJobs.map((job: Job) => job.slug);
          updates.slug = generateUniqueSlug(body.title, existingSlugs);
        }
      }

      if (body.status !== undefined) {
        updates.status = body.status;
      }

      if (body.tags !== undefined) {
        updates.tags = body.tags;
      }

      // Handle order update
      if (body.order !== undefined) {
        if (typeof body.order !== 'number' || body.order < 1) {
          return HttpResponse.json(
            { error: 'Order must be a positive integer' },
            { status: 400 }
          );
        }
        
        // Only update order if it's different from current order
        if (body.order !== existingJob.order) {
          const targetOrder = body.order;
          const currentOrder = existingJob.order;
          
          if (targetOrder > currentOrder) {
            // Moving down: shift jobs between currentOrder+1 and targetOrder down by 1
            const jobsToShift = await db.jobs
              .where('order')
              .between(currentOrder + 1, targetOrder, true, true)
              .toArray();
            
            for (const job of jobsToShift) {
              await db.jobs.update(job.id, { order: job.order - 1, updatedAt: Date.now() });
            }
          } else {
            // Moving up: shift jobs between targetOrder and currentOrder-1 up by 1
            const jobsToShift = await db.jobs
              .where('order')
              .between(targetOrder, currentOrder - 1, true, true)
              .toArray();
            
            for (const job of jobsToShift) {
              await db.jobs.update(job.id, { order: job.order + 1, updatedAt: Date.now() });
            }
          }
          
          updates.order = targetOrder;
        }
      }

      await db.jobs.update(jobId, updates);
      const updatedJob = await db.jobs.get(jobId);

      return HttpResponse.json(updatedJob);
    } catch (error) {
      console.error('Error updating job:', error);
      return HttpResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      );
    }
  }),

  // PATCH /jobs/:id/reorder
  http.patch('/api/jobs/:id/reorder', async ({ params, request }) => {
    await randomDelay();
    
    // Higher failure rate for reorder to test rollback (occasionally return 500)
    if (Math.random() < 0.15) { // 15% error rate for reorder
      return HttpResponse.json(
        { error: 'Reorder operation failed' },
        { status: 500 }
      );
    }

    try {
      const jobId = parseInt(params.id as string);
      const body = await request.json() as ReorderJobRequest;
      
      const { fromOrder, toOrder } = body;
      
      if (fromOrder === toOrder) {
        // No change needed
        const job = await db.jobs.get(jobId);
        return HttpResponse.json(job);
      }

      const jobToMove = await db.jobs.get(jobId);
      if (!jobToMove) {
        return HttpResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      if (jobToMove.order !== fromOrder) {
        return HttpResponse.json(
          { error: 'Job order mismatch' },
          { status: 409 }
        );
      }

      // Perform the reordering logic
      await db.transaction('rw', db.jobs, async () => {
        if (fromOrder < toOrder) {
          // Moving down: shift jobs up
          await db.jobs
            .where('order')
            .between(fromOrder + 1, toOrder, true, true)
            .modify((job: Job) => {
              job.order = job.order - 1;
            });
        } else {
          // Moving up: shift jobs down
          await db.jobs
            .where('order')
            .between(toOrder, fromOrder - 1, true, true)
            .modify((job: Job) => {
              job.order = job.order + 1;
            });
        }

        // Update the moved job
        await db.jobs.update(jobId, {
          order: toOrder,
          updatedAt: Date.now(),
        });
      });

      const updatedJob = await db.jobs.get(jobId);
      return HttpResponse.json(updatedJob);
    } catch (error) {
      console.error('Error reordering job:', error);
      return HttpResponse.json(
        { error: 'Failed to reorder job' },
        { status: 500 }
      );
    }
  }),
];