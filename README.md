# TalentFlow

A modern applicant tracking system (ATS) built with React and TypeScript, designed to streamline the hiring process with intuitive drag-and-drop interfaces and comprehensive candidate management.

🚀 **Live Demo**: [https://talentflows.netlify.app](https://talentflows.netlify.app)

## Overview

TalentFlow provides recruiters and hiring managers with a clean, efficient interface to manage job postings, track candidates through various hiring stages, and conduct assessments. The application focuses on user experience with smooth interactions and responsive design.

## Key Features

- **Interactive Kanban Boards**: Drag-and-drop candidate management across hiring stages
- **Job Management**: Create, edit, and organize job postings with priority ordering
- **Assessment System**: Built-in assessment creation and candidate evaluation tools
- **Real-time Notifications**: Toast notifications for user actions and system feedback
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes

## Tech Stack

### Core Technologies
- **React 19** - Latest React with improved performance and features
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

### State Management & Data
- **Zustand** - Lightweight state management solution
- **Dexie** - Modern IndexedDB wrapper for client-side data persistence
- **React Hook Form** - Efficient form management with minimal re-renders

### UI/UX Libraries
- **@dnd-kit** - Modern drag-and-drop toolkit for accessible interactions
- **@heroicons/react** - Beautiful SVG icons for React
- **React Hot Toast** - Elegant toast notifications
- **Recharts** - Composable charting library for data visualization

### Development Tools
- **Mock Service Worker (MSW)** - API mocking for development and testing
- **ESLint** - Code linting and quality enforcement
- **PostCSS** - CSS processing and optimization

## Architecture

### Project Structure
```
src/
├── api/                    # API layer and mock handlers
│   ├── mocks/             # MSW mock server setup
│   └── *Api.ts            # API service modules
├── components/            # Reusable UI components
│   └── ui/               # Base UI components (Button, Card, etc.)
├── features/             # Feature-based modules
│   ├── assessments/      # Assessment creation and management
│   ├── candidates/       # Candidate management and tracking
│   ├── dashboard/        # Main dashboard views
│   └── jobs/            # Job posting management
├── hooks/               # Custom React hooks
├── store/              # Zustand state stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

### Design Decisions

**Feature-Based Architecture**: We organized code by features rather than file types to improve maintainability and team collaboration. Each feature contains its own components, hooks, and pages.

**Client-Side Data Persistence**: Used Dexie (IndexedDB) instead of a traditional backend to create a fully functional demo without server dependencies. This allows for immediate user interaction while maintaining data across sessions.

**@dnd-kit for Drag & Drop**: Chosen for its accessibility features, TypeScript support, and modern approach to drag-and-drop interactions. Provides smooth animations and proper keyboard navigation.

**Zustand for State Management**: Selected over Redux for its simplicity and minimal boilerplate while still providing powerful state management capabilities.

## Known Issues & Solutions

### Drag & Drop Cursor Alignment
**Issue**: Cursor misalignment during drag operations, particularly when the page is scrolled.

**Root Cause**: Browser viewport calculations in @dnd-kit can be inconsistent when scroll position changes.

**Current Solution**: Implemented whole-card draggable areas instead of small drag handles to improve user experience despite cursor offset.

**Attempted Solutions**:
- Scroll position preservation during drag operations
- Custom DragOverlay positioning
- Various measuring strategies and modifiers

### Performance Considerations
**Virtualization**: Implemented `react-window` for large candidate lists to maintain smooth scrolling performance.

**Optimistic Updates**: Used optimistic state updates for drag operations to provide immediate feedback before API confirmation.

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd talentflow

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

## Future Improvements

- **Real Backend Integration**: Replace IndexedDB with proper API endpoints
- **Advanced Search & Filtering**: Enhanced candidate and job search capabilities
- **Email Integration**: Automated candidate communication
- **Analytics Dashboard**: Hiring metrics and performance insights
- **Collaborative Features**: Team-based candidate evaluation and comments

## Contributing

This project follows conventional commit standards and uses ESLint for code quality. All drag-and-drop interactions should maintain accessibility standards provided by @dnd-kit.

## License

MIT License - see LICENSE file for details.
