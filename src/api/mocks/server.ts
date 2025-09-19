import { setupServer } from 'msw/node';
import { jobsHandlers } from './handlers/jobs';

// Combine all handlers
const handlers = [
  ...jobsHandlers,
];

// Setup MSW server for Node.js (testing environment)
export const server = setupServer(...handlers);