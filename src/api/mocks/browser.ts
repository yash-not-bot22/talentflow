import { setupWorker } from 'msw/browser';
import { jobsHandlers } from './handlers/jobs';
import { candidatesHandlers } from './handlers/candidates';
import { assessmentsHandlers } from './handlers/assessments';

// Combine all handlers
const handlers = [
  ...jobsHandlers,
  ...candidatesHandlers,
  ...assessmentsHandlers,
];

// Setup MSW worker
export const worker = setupWorker(...handlers);