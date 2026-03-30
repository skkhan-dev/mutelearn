import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useMode } from '../contexts/ModeContext';

const GRADE_LEVELS = [
  { id: 'middle-school', label: 'Middle School', icon: '🏫', description: 'Grades 6-8' },
  { id: 'high-school', label: 'High School', icon: '🎒', description: 'Grades 9-12' },
  { id: 'college', label: 'College', icon: '🎓', description: 'University level' },
];

const MODE_OPTIONS = [
  {
    id: 'adhd',
    label: 'ADHD',
    icon: '⚡',
    description: 'Short sessions, extra rewards, focused single-task view',
    color: 'border-amber-300 bg-amber-50',
  },
  {
    id: 'dyslexia',
    label: 'Dyslexia',
    icon: '👁️',
    description: 'Easy-read fonts, text-to-speech, warm color overlay',
    color: 'border-blue-300 bg-blue-50',
  },
  {
    id: 'add',
    label: 'ADD',
    icon: '🎯',
    description: 'Structured flow, task chunking, gentle reminders',
    color: 'border-purple-300 bg-purple-50',
  },
  {
    id: 'default',
    label: 'Just the basics',
    icon: '📚',
    description: 'Standard study experience with all the features',
    color: 'border-gray-300 bg-gray-50',
  },
];

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i <= currentStep
              ? 'w-8 bg-indigo-500'
              : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding } = useUser();
  const { switchMode } = useMode();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [selectedMode, setSelectedMode] = useState('default');

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    completeOnboarding(name.trim() || 'Learner', gradeLevel);
    switchMode(selectedMode);
    navigate('/dashboard');
  };

  const canProceed =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && gradeLevel) ||
    step === 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600">MuteLearn</h1>
          <p className="text-gray-500 mt-2">Your personal study companion</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <StepIndicator currentStep={step} totalSteps={3} />

          {/* Step 1: Name */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-5xl block mb-4">👋</span>
                <h2 className="text-2xl font-bold text-gray-800">Hey there!</h2>
                <p className="text-gray-500 mt-2">
                  Let&apos;s get you set up. What should we call you?
                </p>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 text-center text-xl text-gray-800 placeholder-gray-300 transition-colors"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
              />
            </div>
          )}

          {/* Step 2: Grade Level */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-5xl block mb-4">📖</span>
                <h2 className="text-2xl font-bold text-gray-800">
                  Nice to meet you, {name.split(' ')[0]}!
                </h2>
                <p className="text-gray-500 mt-2">What grade level are you studying at?</p>
              </div>

              <div className="space-y-3">
                {GRADE_LEVELS.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => setGradeLevel(grade.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      gradeLevel === grade.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-3xl">{grade.icon}</span>
                    <div className="text-left">
                      <span className="font-bold text-gray-800 block">{grade.label}</span>
                      <span className="text-sm text-gray-500">{grade.description}</span>
                    </div>
                    {gradeLevel === grade.id && (
                      <span className="ml-auto text-indigo-500 text-xl">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Mode Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-5xl block mb-4">✨</span>
                <h2 className="text-2xl font-bold text-gray-800">Almost done!</h2>
                <p className="text-gray-500 mt-2">
                  Would any of these help you study better?
                </p>
              </div>

              <div className="space-y-3">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedMode(opt.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      selectedMode === opt.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : `${opt.color} hover:opacity-90`
                    }`}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <div className="text-left flex-1">
                      <span className="font-bold text-gray-800 block">{opt.label}</span>
                      <span className="text-sm text-gray-500">{opt.description}</span>
                    </div>
                    {selectedMode === opt.id && (
                      <span className="text-indigo-500 text-xl shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center">
                You can always change this later in Settings
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`${
                step > 0 ? 'flex-1' : 'w-full'
              } py-3 bg-indigo-500 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {step === 2 ? "Let's Go!" : 'Continue'}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          MuteLearn adapts to how you learn best
        </p>
      </div>
    </div>
  );
}
