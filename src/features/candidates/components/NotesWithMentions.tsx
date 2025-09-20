import { useState, useRef } from 'react';
import {
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  CalendarIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';

interface Note {
  text: string;
  timestamp: number;
}

interface MentionUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface NotesWithMentionsProps {
  notes: Note[];
  onAddNote: (noteText: string) => void;
}

// Mock users for @mentions (in a real app, this would come from an API)
const MOCK_USERS: MentionUser[] = [
  { id: '1', name: 'John Smith', email: 'john@company.com' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com' },
  { id: '3', name: 'Mike Davis', email: 'mike@company.com' },
  { id: '4', name: 'Lisa Wilson', email: 'lisa@company.com' },
  { id: '5', name: 'Alex Chen', email: 'alex@company.com' },
  { id: '6', name: 'Emma Brown', email: 'emma@company.com' },
];

interface MentionSuggestionsProps {
  query: string;
  onSelect: (user: MentionUser) => void;
  position: { top: number; left: number };
  isVisible: boolean;
}

function MentionSuggestions({ query, onSelect, position, isVisible }: MentionSuggestionsProps) {
  const filteredUsers = MOCK_USERS.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.email.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  if (!isVisible || filteredUsers.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-48 overflow-y-auto"
      style={{ top: position.top, left: position.left, minWidth: '200px' }}
    >
      {filteredUsers.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function renderNoteWithMentions(text: string) {
  // Simple regex to find @mentions
  const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
  const parts = text.split(mentionRegex);
  
  return parts.map((part, index) => {
    // Every odd index is a captured mention
    if (index % 2 === 1) {
      return (
        <span
          key={index}
          className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium mr-1"
        >
          <AtSymbolIcon className="h-3 w-3 mr-1" />
          {part}
        </span>
      );
    }
    return part;
  });
}

export function NotesWithMentions({ notes, onAddNote }: NotesWithMentionsProps) {
  const [newNote, setNewNote] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setNewNote(value);
    setCursorPosition(cursor);

    // Check for @ mentions
    const textBeforeCursor = value.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      
      // Calculate position for mention suggestions
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const rect = textarea.getBoundingClientRect();
        
        // Simple calculation - in a real app, you'd want more precise positioning
        const lineHeight = 20;
        const lines = textBeforeCursor.split('\n').length;
        
        setMentionPosition({
          top: rect.top + (lines * lineHeight) + 25,
          left: rect.left + 10,
        });
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: MentionUser) => {
    const textBeforeCursor = newNote.slice(0, cursorPosition);
    const textAfterCursor = newNote.slice(cursorPosition);
    
    // Find the @ symbol position
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    const beforeMention = textBeforeCursor.slice(0, mentionStart);
    
    const newText = `${beforeMention}@${user.name} ${textAfterCursor}`;
    setNewNote(newText);
    setShowMentions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + user.name.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today at ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 2) {
      return 'Yesterday at ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' }) + ' at ' + 
             date.toLocaleTimeString('en-US', { 
               hour: 'numeric', 
               minute: '2-digit',
               hour12: true 
             });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      }) + ' at ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <label htmlFor="note" className="sr-only">
            Add a note
          </label>
          <textarea
            ref={textareaRef}
            id="note"
            name="note"
            rows={4}
            className="block w-full resize-none border-0 py-3 px-4 text-gray-900 placeholder-gray-500 focus:ring-0 focus:outline-none"
            placeholder="Add a note... Use @username to mention team members"
            value={newNote}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          {/* Mention Suggestions */}
          <MentionSuggestions
            query={mentionQuery}
            onSelect={handleMentionSelect}
            position={mentionPosition}
            isVisible={showMentions}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between py-2 px-4 bg-gray-50">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <AtSymbolIcon className="h-4 w-4" />
              <span>Use @ to mention team members</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                Cmd+Enter
              </kbd>
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                Add Note
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notes yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start the conversation by adding a note above.
            </p>
          </div>
        ) : (
          notes.map((note, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-900 leading-relaxed">
                    {renderNoteWithMentions(note.text)}
                  </div>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {formatDate(note.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Mention Examples */}
      {notes.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Type <code className="bg-blue-100 px-1 rounded">@</code> to mention team members</li>
            <li>• Use <kbd className="bg-blue-100 px-1 rounded text-xs">Cmd+Enter</kbd> to quickly add notes</li>
            <li>• Mentions will notify the mentioned user</li>
          </ul>
        </div>
      )}
    </div>
  );
}