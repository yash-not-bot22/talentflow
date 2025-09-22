import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrashIcon,
  EyeIcon,
  CheckIcon,
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import type { Assessment, Question } from '../../../db';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { assessmentsApi } from '../../../api/assessmentsApi';
import toast from 'react-hot-toast';

type QuestionType = 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload';

interface AssessmentBuilderProps {
  initialAssessment?: Assessment;
  onSave?: (assessment: Assessment) => void;
  onCancel?: () => void;
}

// Question Type Icons and Labels
const questionTypes = [
  { type: 'single-choice' as QuestionType, label: 'Single Choice', icon: '⚪', description: 'Radio buttons - select one option' },
  { type: 'multi-choice' as QuestionType, label: 'Multiple Choice', icon: '☑️', description: 'Checkboxes - select multiple options' },
  { type: 'short-text' as QuestionType, label: 'Short Text', icon: '📝', description: 'Single line text input' },
  { type: 'long-text' as QuestionType, label: 'Long Text', icon: '📄', description: 'Multi-line text area' },
  { type: 'numeric' as QuestionType, label: 'Numeric', icon: '🔢', description: 'Number input with range validation' },
  { type: 'file-upload' as QuestionType, label: 'File Upload', icon: '📎', description: 'File attachment (resume, portfolio, etc.)' },
];

interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

// Preview question component for rendering questions as they would appear to candidates
interface PreviewQuestionProps {
  question: Question;
  index: number;
}

function PreviewQuestion({ question, index }: PreviewQuestionProps) {
  const [value, setValue] = useState<string | string[]>('');
  const [subQuestionValues, setSubQuestionValues] = useState<Record<string, string | string[]>>({});

  const handleChange = (newValue: string | string[]) => {
    setValue(newValue);
  };

  const handleSubQuestionChange = (subQuestionId: string, newValue: string | string[]) => {
    setSubQuestionValues(prev => ({
      ...prev,
      [subQuestionId]: newValue
    }));
  };

  // Check if sub-questions should be shown (when main question has any answer)
  const shouldShowSubQuestions = question.conditional && question.subQuestions && 
    (value !== '' && value !== null && value !== undefined && 
     (!Array.isArray(value) || value.length > 0));

  const renderSubQuestionInput = (subQuestion: Question) => {
    const subValue = subQuestionValues[subQuestion.id] || '';
    
    switch (subQuestion.type) {
      case 'single-choice':
        return (
          <div className="space-y-2">
            {(subQuestion.options || []).map((option, optIndex) => (
              <label key={optIndex} className="flex items-center">
                <input
                  type="radio"
                  name={`subquestion-${subQuestion.id}`}
                  value={option}
                  checked={subValue === option}
                  onChange={(e) => handleSubQuestionChange(subQuestion.id, e.target.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multi-choice':
        return (
          <div className="space-y-2">
            {(subQuestion.options || []).map((option, optIndex) => (
              <label key={optIndex} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(subValue) && subValue.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(subValue) ? subValue : [];
                    if (e.target.checked) {
                      handleSubQuestionChange(subQuestion.id, [...currentValues, option]);
                    } else {
                      handleSubQuestionChange(subQuestion.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="mr-3 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'short-text':
        return (
          <input
            type="text"
            value={subValue as string}
            onChange={(e) => handleSubQuestionChange(subQuestion.id, e.target.value)}
            maxLength={subQuestion.maxLength}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your answer..."
          />
        );

      case 'long-text':
        return (
          <textarea
            value={subValue as string}
            onChange={(e) => handleSubQuestionChange(subQuestion.id, e.target.value)}
            maxLength={subQuestion.maxLength}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your answer..."
          />
        );

      case 'numeric':
        return (
          <input
            type="number"
            value={subValue as string}
            onChange={(e) => handleSubQuestionChange(subQuestion.id, e.target.value)}
            min={subQuestion.min}
            max={subQuestion.max}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter a number..."
          />
        );

      case 'file-upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="space-y-2">
              <div className="text-gray-400">
                <svg className="mx-auto h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm text-gray-600">
                <button className="text-blue-600 hover:text-blue-500">Upload a file</button> or drag and drop
              </div>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-500 italic">Unknown question type</div>;
    }
  };

  const renderInput = () => {
    switch (question.type) {
      case 'single-choice':
        return (
          <div className="space-y-2">
            {(question.options || []).map((option, optIndex) => (
              <label key={optIndex} className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(e.target.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multi-choice':
        return (
          <div className="space-y-2">
            {(question.options || []).map((option, optIndex) => (
              <label key={optIndex} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange([...currentValues, option]);
                    } else {
                      handleChange(currentValues.filter(v => v !== option));
                    }
                  }}
                  className="mr-3 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'short-text':
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={question.maxLength}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your answer..."
          />
        );

      case 'long-text':
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={question.maxLength}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your answer..."
          />
        );

      case 'numeric':
        return (
          <input
            type="number"
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            min={question.min}
            max={question.max}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter a number..."
          />
        );

      case 'file-upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm text-gray-600">
                <button className="text-blue-600 hover:text-blue-500">Upload a file</button> or drag and drop
              </div>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-500 italic">Unknown question type</div>;
    }
  };

  return (
    <div className="border-l-4 border-blue-200 pl-6 py-4">
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white text-lg">
          {index + 1}. {question.text || 'Untitled Question'}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h4>
      </div>
      
      <div className="space-y-2">
        {renderInput()}
        
        {/* Validation info */}
        <div className="text-xs text-gray-500 space-y-1">
          {question.maxLength && (
            <div>Maximum {question.maxLength} characters</div>
          )}
          {question.min !== undefined && question.max !== undefined && (
            <div>Value must be between {question.min} and {question.max}</div>
          )}
          {question.min !== undefined && question.max === undefined && (
            <div>Minimum value: {question.min}</div>
          )}
          {question.max !== undefined && question.min === undefined && (
            <div>Maximum value: {question.max}</div>
          )}
        </div>
      </div>

      {/* Sub-questions */}
      {shouldShowSubQuestions && (
        <div className="mt-6 ml-6 space-y-4 border-l-2 border-blue-200 pl-6">
          <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Follow-up questions:
          </h5>
          {question.subQuestions!.map((subQuestion, subIndex) => (
            <div key={subQuestion.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="mb-3">
                <h6 className="font-medium text-gray-900 dark:text-white">
                  {index + 1}.{subIndex + 1}. {subQuestion.text || 'Untitled Sub-question'}
                  {subQuestion.required && <span className="text-red-500 ml-1">*</span>}
                </h6>
              </div>
              
              <div className="space-y-2">
                {renderSubQuestionInput(subQuestion)}
                
                {/* Sub-question validation info */}
                <div className="text-xs text-gray-500 space-y-1">
                  {subQuestion.maxLength && (
                    <div>Maximum {subQuestion.maxLength} characters</div>
                  )}
                  {subQuestion.min !== undefined && subQuestion.max !== undefined && (
                    <div>Value must be between {subQuestion.min} and {subQuestion.max}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Enhanced question editor with full functionality
function QuestionEditor({ question, onUpdate, onDelete }: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateQuestion = (updates: Partial<Question>) => {
    onUpdate({ ...question, ...updates });
  };

  const addOption = () => {
    const newOption = `Option ${(question.options?.length || 0) + 1}`;
    updateQuestion({
      options: [...(question.options || []), newOption]
    });
  };

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...(question.options || [])];
    updatedOptions[index] = value;
    updateQuestion({ options: updatedOptions });
  };

  const removeOption = (index: number) => {
    const updatedOptions = question.options?.filter((_: string, i: number) => i !== index) || [];
    updateQuestion({ options: updatedOptions });
  };

  const addSubQuestion = (questionType: QuestionType = 'short-text') => {
    const newSubQuestion: Question = {
      id: `subq_${Date.now()}`,
      text: '',
      type: questionType,
      required: false,
      conditional: false,
      options: questionType === 'single-choice' || questionType === 'multi-choice' ? ['Option 1', 'Option 2'] : undefined
    };

    const updatedSubQuestions = [...(question.subQuestions || []), newSubQuestion];
    updateQuestion({ subQuestions: updatedSubQuestions });
  };

  const updateSubQuestion = (index: number, updates: Partial<Question>) => {
    const updatedSubQuestions = [...(question.subQuestions || [])];
    updatedSubQuestions[index] = { ...updatedSubQuestions[index], ...updates };
    updateQuestion({ subQuestions: updatedSubQuestions });
  };

  const removeSubQuestion = (index: number) => {
    const updatedSubQuestions = question.subQuestions?.filter((_, i) => i !== index) || [];
    updateQuestion({ subQuestions: updatedSubQuestions });
  };

  const typeInfo = questionTypes.find(t => t.type === question.type);
  const needsOptions = question.type === 'single-choice' || question.type === 'multi-choice';

  return (
    <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 rounded-3xl shadow-xl relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
      <div className="relative">
        {/* Question Header */}
        <div 
          className="p-4 border-b border-white/20 dark:border-slate-600/30 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-t-3xl transition-all duration-300"
          onClick={() => setIsExpanded(!isExpanded)}
        >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bars3Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="text-lg">{typeInfo?.icon}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {question.text || 'Untitled Question'}
              </span>
            </div>
            {question.required && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                Required
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{typeInfo?.label}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Question Editor */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Text *
            </label>
            <input
              type="text"
              value={question.text}
              onChange={(e) => updateQuestion({ text: e.target.value })}
              className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your question..."
            />
          </div>

          {/* Question Settings */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={question.required || false}
                onChange={(e) => updateQuestion({ required: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Required question</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={question.conditional || false}
                onChange={(e) => updateQuestion({ conditional: e.target.checked, subQuestions: e.target.checked ? (question.subQuestions || []) : undefined })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Has sub-questions</span>
            </label>
          </div>

          {/* Options for choice questions */}
          {needsOptions && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Answer Options
                </label>
                <button
                  onClick={addOption}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-2">
                {(question.options || []).map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Option text..."
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {(question.options?.length || 0) < 2 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-2 mt-2">
                  ⚠️ Choice questions need at least 2 options
                </p>
              )}
            </div>
          )}

          {/* Numeric range validation */}
          {question.type === 'numeric' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Value (Optional)
                </label>
                <input
                  type="number"
                  value={question.min || ''}
                  onChange={(e) => updateQuestion({ min: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No minimum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Value (Optional)
                </label>
                <input
                  type="number"
                  value={question.max || ''}
                  onChange={(e) => updateQuestion({ max: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No maximum"
                />
              </div>
            </div>
          )}

          {/* Text length validation */}
          {(question.type === 'short-text' || question.type === 'long-text') && (
            <div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Characters (Optional)
                </label>
                <input
                  type="number"
                  value={question.maxLength || ''}
                  onChange={(e) => updateQuestion({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No maximum"
                />
              </div>
            </div>
          )}

          {/* Sub-questions for conditional questions */}
          {question.conditional && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sub-questions (shown when this question is answered)
                </label>
                <div className="flex space-x-2">
                  {questionTypes.slice(0, 3).map(type => (
                    <button
                      key={type.type}
                      onClick={() => addSubQuestion(type.type)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-slate-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
                      title={`Add ${type.label}`}
                    >
                      <span className="mr-1">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3 ml-4 border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                {(question.subQuestions || []).map((subQuestion, index) => (
                  <div key={subQuestion.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Sub-question {index + 1}
                      </span>
                      <button
                        onClick={() => removeSubQuestion(index)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={subQuestion.text}
                        onChange={(e) => updateSubQuestion(index, { text: e.target.value })}
                        className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Sub-question text..."
                      />
                      
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={subQuestion.required || false}
                            onChange={(e) => updateSubQuestion(index, { required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Required</span>
                        </label>
                        
                        <select
                          value={subQuestion.type}
                          onChange={(e) => updateSubQuestion(index, { 
                            type: e.target.value as QuestionType,
                            options: ['single-choice', 'multi-choice'].includes(e.target.value) ? ['Option 1', 'Option 2'] : undefined
                          })}
                          className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {questionTypes.map(type => (
                            <option key={type.type} value={type.type}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Options for choice sub-questions */}
                      {(['single-choice', 'multi-choice'].includes(subQuestion.type)) && (
                        <div className="mt-2">
                          <div className="space-y-1">
                            {(subQuestion.options || []).map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 w-4">{optIndex + 1}.</span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const updatedOptions = [...(subQuestion.options || [])];
                                    updatedOptions[optIndex] = e.target.value;
                                    updateSubQuestion(index, { options: updatedOptions });
                                  }}
                                  className="flex-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Option text..."
                                />
                                <button
                                  onClick={() => {
                                    const updatedOptions = subQuestion.options?.filter((_, i) => i !== optIndex) || [];
                                    updateSubQuestion(index, { options: updatedOptions });
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              const newOption = `Option ${(subQuestion.options?.length || 0) + 1}`;
                              const updatedOptions = [...(subQuestion.options || []), newOption];
                              updateSubQuestion(index, { options: updatedOptions });
                            }}
                            className="mt-1 inline-flex items-center px-2 py-1 border border-gray-300 dark:border-slate-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Add Option
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!question.subQuestions || question.subQuestions.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No sub-questions added yet. Use the buttons above to add sub-questions.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export function AssessmentBuilder({ initialAssessment, onSave, onCancel }: AssessmentBuilderProps) {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);

  useEffect(() => {
    if (initialAssessment) {
      setAssessment(initialAssessment);
      setCurrentSectionId(initialAssessment.sections[0]?.id || null);
      setLoading(false);
    } else if (jobId && jobId !== 'new') {
      // Load existing assessment for the job
      loadAssessment(Number(jobId));
    } else {
      // Create new assessment
      createNewAssessment();
    }
  }, [jobId, initialAssessment]);

  const loadAssessment = async (assessmentJobId: number) => {
    try {
      setLoading(true);
      const assessment = await assessmentsApi.getAssessment(assessmentJobId);
      setAssessment(assessment);
      setCurrentSectionId(assessment.sections[0]?.id || null);
    } catch (err) {
      console.error('Failed to load assessment:', err);
      // If assessment doesn't exist for this job, create a new one
      toast('No assessment found for this job. Creating a new one.', { icon: 'ℹ️' });
      createNewAssessment(assessmentJobId);
    } finally {
      setLoading(false);
    }
  };

  const createNewAssessment = (jobIdForAssessment?: number) => {
    const sectionId = `section_${Date.now()}`;
    const newAssessment: Assessment = {
      jobId: jobIdForAssessment || 0, // Use provided jobId or default to 0
      sections: [
        {
          id: sectionId,
          name: 'General Questions',
          questions: []
        }
      ],
      updatedAt: Date.now()
    };
    setAssessment(newAssessment);
    setCurrentSectionId(sectionId);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!assessment) return;
    
    try {
      setSaving(true);
      
      // Validate that we have a jobId
      const targetJobId = assessment.jobId || (jobId && jobId !== 'new' ? Number(jobId) : null);
      if (!targetJobId) {
        toast.error('Please select a job for this assessment');
        setSaving(false);
        return;
      }

      // Validate assessment
      const errors = assessmentsApi.validateAssessment({
        sections: assessment.sections
      });
      
      if (errors.length > 0) {
        // Show the first error with more user-friendly messaging
        const firstError = errors[0];
        
        // Customize error messages for better user experience
        if (firstError.includes('Must have question text')) {
          toast.error('Please add a question title/text for all questions');
        } else if (firstError.includes('Must have at least one question')) {
          toast.error('Please add at least one question to your assessment');
        } else if (firstError.includes('Must have at least one section')) {
          toast.error('Please add at least one section to your assessment');
        } else if (firstError.includes('Must have a name')) {
          toast.error('Please add a name/title for all sections');
        } else if (firstError.includes('Choice questions must have at least 2 options')) {
          toast.error('Multiple choice questions need at least 2 answer options');
        } else if (firstError.includes('Must have a valid type')) {
          toast.error('Please select a question type for all questions');
        } else {
          // Show original error message for other cases
          toast.error(`Validation failed: ${firstError}`);
        }
        
        // If there are multiple errors, show a count
        if (errors.length > 1) {
          setTimeout(() => {
            toast.error(`${errors.length - 1} more validation issue(s) found. Please review your assessment.`);
          }, 100);
        }
        
        setSaving(false);
        return;
      }

      // Save assessment
      const savedAssessment = await assessmentsApi.updateAssessment(targetJobId, {
        sections: assessment.sections
      });
      
      setAssessment(savedAssessment);
      toast.success('Assessment saved successfully!');
      
      if (onSave) {
        onSave(savedAssessment);
      }
    } catch (err) {
      console.error('Failed to save assessment:', err);
      toast.error('Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/jobs');
    }
  };

  const addQuestion = (questionType: QuestionType = 'short-text') => {
    if (!assessment || !currentSectionId) return;

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: questionType,
      required: false,
      conditional: false,
      options: questionType === 'single-choice' || questionType === 'multi-choice' ? ['Option 1', 'Option 2'] : undefined
    };

    const updatedSections = assessment.sections.map(section => 
      section.id === currentSectionId
        ? { ...section, questions: [...section.questions, newQuestion] }
        : section
    );

    setAssessment({ ...assessment, sections: updatedSections });
    setShowQuestionTypeModal(false);
  };

  const handleAddQuestionClick = () => {
    if (!currentSectionId) return;
    setShowQuestionTypeModal(true);
  };

  const addSection = () => {
    if (!assessment) return;

    const newSection = {
      id: `section_${Date.now()}`,
      name: `Section ${assessment.sections.length + 1}`,
      questions: []
    };

    const updatedSections = [...assessment.sections, newSection];
    setAssessment({ ...assessment, sections: updatedSections });
    setCurrentSectionId(newSection.id);
  };

  const updateSectionName = (sectionId: string, newName: string) => {
    if (!assessment) return;

    const updatedSections = assessment.sections.map(section => 
      section.id === sectionId
        ? { ...section, name: newName }
        : section
    );

    setAssessment({ ...assessment, sections: updatedSections });
  };

  const deleteSection = (sectionId: string) => {
    if (!assessment || assessment.sections.length <= 1) return;

    const updatedSections = assessment.sections.filter(section => section.id !== sectionId);
    setAssessment({ ...assessment, sections: updatedSections });
    
    // Switch to first section if we deleted the current one
    if (currentSectionId === sectionId) {
      setCurrentSectionId(updatedSections[0]?.id || null);
    }
  };

  const updateQuestion = (questionId: string, updatedQuestion: Question) => {
    if (!assessment) return;

    const updatedSections = assessment.sections.map(section => ({
      ...section,
      questions: section.questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      )
    }));

    setAssessment({ ...assessment, sections: updatedSections });
  };

  const deleteQuestion = (questionId: string) => {
    if (!assessment) return;

    const updatedSections = assessment.sections.map(section => ({
      ...section,
      questions: section.questions.filter(q => q.id !== questionId)
    }));

    setAssessment({ ...assessment, sections: updatedSections });
  };

  // Get current section
  const currentSection = assessment?.sections.find(section => section.id === currentSectionId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Assessment not found</p>
        <button
          onClick={() => navigate('/jobs')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  const totalQuestions = assessment.sections.reduce((total, section) => total + section.questions.length, 0);

  return (
    <div className="min-h-screen backdrop-blur-xl bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 rounded-3xl p-6 shadow-xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="p-2 backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 shadow-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {jobId === 'new' ? 'Create New Assessment' : `Edit Assessment for Job #${assessment.jobId}`}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Design questions and sections for candidate evaluation
                  </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-lg transition-colors ${
                previewMode 
                  ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600'
              }`}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </button>
            
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
              <CheckIcon className="h-4 w-4 mr-2" />
              Save Assessment
            </button>
          </div>
        </div>
        
        {/* Assessment Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <span className="font-medium">{assessment.sections.length}</span>
            <span className="ml-1">sections</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{totalQuestions}</span>
            <span className="ml-1">questions</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">Last saved:</span>
            <span className="ml-1">{new Date(assessment.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {previewMode ? (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Assessment Preview</h3>
          <div className="space-y-8">
            {assessment.sections.map(section => (
              <div key={section.id} className="border border-gray-200 dark:border-slate-600 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{section.name}</h4>
                <div className="space-y-6">
                  {section.questions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">📝</div>
                      <p className="text-lg font-medium">No questions in this section yet</p>
                      <p className="text-sm">Add questions using the builder to see the preview</p>
                    </div>
                  ) : (
                    section.questions.map((question, index) => (
                      <PreviewQuestion
                        key={question.id}
                        question={question}
                        index={index}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
            
            {/* Submit Button for Preview */}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-600">
              <button
                disabled
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium opacity-50 cursor-not-allowed"
              >
                Submit Assessment (Preview Mode)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section Tabs */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 rounded-3xl p-6 shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sections</h3>
                <button
                  onClick={addSection}
                  className="inline-flex items-center px-3 py-2 backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 shadow-lg text-sm font-medium rounded-xl text-blue-700 dark:text-blue-300 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-1"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Section
                </button>
              </div>
            
            <div className="flex space-x-1 mb-4">
              {assessment.sections.map(section => (
                <div key={section.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentSectionId(section.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentSectionId === section.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {section.name}
                  </button>
                  {assessment.sections.length > 1 && (
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="ml-1 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded"
                      title="Delete section"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Section Name Editor */}
            {currentSection && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  value={currentSection.name}
                  onChange={(e) => updateSectionName(currentSection.id, e.target.value)}
                  className="block w-full border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter section name..."
                />
              </div>
            )}
            </div>
          </div>

          {/* Question Type Selector */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 rounded-3xl p-6 shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
            <div className="relative">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Question Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {questionTypes.map(type => (
                  <button
                    key={type.type}
                    onClick={() => addQuestion(type.type)}
                    disabled={!currentSectionId}
                    className="flex items-center p-3 backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-1 text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                  <span className="text-2xl mr-3">{type.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{type.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* Questions */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 rounded-3xl p-6 shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Questions {currentSection && `- ${currentSection.name}`}
                </h3>
                <button
                  onClick={handleAddQuestionClick}
                  disabled={!currentSectionId}
                  className="px-4 py-2 backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-300 hover:scale-105 hover:rotate-1"
                >
                Add Question
              </button>
            </div>
            
            <div className="space-y-4">
              {!currentSection ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No section selected.</p>
                  <p className="text-sm">Select a section above to start adding questions.</p>
                </div>
              ) : currentSection.questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No questions added yet.</p>
                  <p className="text-sm">Click "Add Question" or select a question type above to get started.</p>
                </div>
              ) : (
                currentSection.questions.map(question => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    onUpdate={(updatedQuestion: Question) => updateQuestion(question.id, updatedQuestion)}
                    onDelete={() => deleteQuestion(question.id)}
                  />
                ))
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Type Selection Modal */}
      {showQuestionTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Select Question Type
              </h3>
              <button
                onClick={() => setShowQuestionTypeModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionTypes.map(type => (
                <button
                  key={type.type}
                  onClick={() => addQuestion(type.type)}
                  className="flex items-start p-4 border border-gray-200 dark:border-slate-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-left group"
                >
                  <span className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">{type.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{type.label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Choose the type of question you want to add to this section
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </div>
  );
}