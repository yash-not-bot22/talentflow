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

  const handleChange = (newValue: string | string[]) => {
    setValue(newValue);
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
                <span className="text-gray-700">{option}</span>
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
                <span className="text-gray-700">{option}</span>
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
        <h4 className="font-medium text-gray-900 text-lg">
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

  const typeInfo = questionTypes.find(t => t.type === question.type);
  const needsOptions = question.type === 'single-choice' || question.type === 'multi-choice';

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Question Header */}
      <div 
        className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bars3Icon className="h-4 w-4 text-gray-400" />
              <span className="text-lg">{typeInfo?.icon}</span>
              <span className="font-medium text-gray-900">
                {question.text || 'Untitled Question'}
              </span>
            </div>
            {question.required && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Required
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{typeInfo?.label}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <input
              type="text"
              value={question.text}
              onChange={(e) => updateQuestion({ text: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <span className="ml-2 text-sm text-gray-700">Required question</span>
            </label>
          </div>

          {/* Options for choice questions */}
          {needsOptions && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options
                </label>
                <button
                  onClick={addOption}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-2">
                {(question.options || []).map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Option text..."
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {(question.options?.length || 0) < 2 && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                  ⚠️ Choice questions need at least 2 options
                </p>
              )}
            </div>
          )}

          {/* Numeric range validation */}
          {question.type === 'numeric' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Value (Optional)
                </label>
                <input
                  type="number"
                  value={question.min || ''}
                  onChange={(e) => updateQuestion({ min: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No minimum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Value (Optional)
                </label>
                <input
                  type="number"
                  value={question.max || ''}
                  onChange={(e) => updateQuestion({ max: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No maximum"
                />
              </div>
            </div>
          )}

          {/* Text length validation */}
          {(question.type === 'short-text' || question.type === 'long-text') && (
            <div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Characters (Optional)
                </label>
                <input
                  type="number"
                  value={question.maxLength || ''}
                  onChange={(e) => updateQuestion({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No maximum"
                />
              </div>
            </div>
          )}
        </div>
      )}
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
        return;
      }

      // Validate assessment
      const errors = assessmentsApi.validateAssessment({
        sections: assessment.sections
      });
      
      if (errors.length > 0) {
        toast.error(`Validation failed: ${errors[0]}`);
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
      options: questionType === 'single-choice' || questionType === 'multi-choice' ? ['Option 1', 'Option 2'] : undefined
    };

    const updatedSections = assessment.sections.map(section => 
      section.id === currentSectionId
        ? { ...section, questions: [...section.questions, newQuestion] }
        : section
    );

    setAssessment({ ...assessment, sections: updatedSections });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {jobId === 'new' ? 'Create New Assessment' : `Edit Assessment for Job #${assessment.jobId}`}
              </h1>
              <p className="text-gray-600 mt-1">
                Design questions and sections for candidate evaluation
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-lg transition-colors ${
                previewMode 
                  ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </button>
            
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
              <CheckIcon className="h-4 w-4 mr-2" />
              Save Assessment
            </button>
          </div>
        </div>
        
        {/* Assessment Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-600">
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
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Assessment Preview</h3>
          <div className="space-y-8">
            {assessment.sections.map(section => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-6">{section.name}</h4>
                <div className="space-y-6">
                  {section.questions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
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
            <div className="flex justify-end pt-6 border-t border-gray-200">
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
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
              <button
                onClick={addSection}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {section.name}
                  </button>
                  {assessment.sections.length > 1 && (
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="ml-1 p-1 text-red-500 hover:text-red-700 rounded"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  value={currentSection.name}
                  onChange={(e) => updateSectionName(currentSection.id, e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter section name..."
                />
              </div>
            )}
          </div>

          {/* Question Type Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {questionTypes.map(type => (
                <button
                  key={type.type}
                  onClick={() => addQuestion(type.type)}
                  disabled={!currentSectionId}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl mr-3">{type.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Questions {currentSection && `- ${currentSection.name}`}
              </h3>
              <button
                onClick={() => addQuestion()}
                disabled={!currentSectionId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Question
              </button>
            </div>
            
            <div className="space-y-4">
              {!currentSection ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No section selected.</p>
                  <p className="text-sm">Select a section above to start adding questions.</p>
                </div>
              ) : currentSection.questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
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
      )}
    </div>
  );
}