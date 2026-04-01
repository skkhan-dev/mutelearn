import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLMS } from '../contexts/LMSContext';
import { useMode } from '../contexts/ModeContext';
import { useProfessor } from '../contexts/ProfessorContext';
import { useStudy } from '../contexts/StudyContext';
import { buildDueLabel, formatDateTime } from '../lib/dateUtils';

function StatTile({ label, value, detail, tone = 'indigo' }) {
  const toneClasses = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
      <p className={`inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-semibold ${toneClasses[tone]}`}>
        {detail}
      </p>
    </div>
  );
}

function buildAssignmentStatusTone(status) {
  if (status === 'submitted') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'in_progress') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function StudyPackDetailPage() {
  const navigate = useNavigate();
  const { packId } = useParams();
  const { openProfessor } = useProfessor();
  const {
    isCanvasConnected,
    connectCanvasDemo,
    getStudyPackById,
    toggleStudyPackChecklistItem,
    updateStudyPackReflection,
    updateAssignmentStatus,
    linkStudyPackDeck,
  } = useLMS();
  const { modeConfig } = useMode();
  const { createDeck, addCardsFromImport } = useStudy();
  const pack = useMemo(() => getStudyPackById(packId), [getStudyPackById, packId]);

  const handleCreateDeck = () => {
    if (!pack) {
      return;
    }

    if (pack.linkedDeckId) {
      navigate(`/flashcards/${pack.linkedDeckId}`);
      return;
    }

    const deck = createDeck(pack.title, pack.course?.name || 'Synced course');
    addCardsFromImport(deck.id, pack.flashcards);
    linkStudyPackDeck(pack.id, deck.id);
    navigate(`/flashcards/${deck.id}`);
  };

  if (!isCanvasConnected) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm text-center">
          <p className="text-5xl mb-4">📦</p>
          <h1 className="text-3xl font-bold text-gray-800">Study Pack Workspace</h1>
          <p className="text-gray-500 max-w-2xl mx-auto mt-2">
            Connect course data first, and MuteLearn will build focused assignment and exam
            workspaces automatically.
          </p>
          <button
            onClick={connectCanvasDemo}
            className="mt-6 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            Connect Canvas Demo
          </button>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm text-center space-y-4">
          <p className="text-5xl">🧭</p>
          <h1 className="text-3xl font-bold text-gray-800">Study pack not found</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            This pack may have been removed during the latest sync. Head back to your pack list
            and open one of the currently active assignments.
          </p>
          <button
            onClick={() => navigate('/study-packs')}
            className="px-5 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            Back to Study Packs
          </button>
        </div>
      </div>
    );
  }

  const assignmentStatus = pack.assignment?.status || 'pending';
  const focusMinutes = modeConfig?.timer?.focus || 25;
  const assignmentTypeLabel = pack.assignment?.type || pack.sourceType || 'assignment';
  const assignmentTone = buildAssignmentStatusTone(assignmentStatus);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => navigate('/study-packs')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>←</span>
        <span>Back to Study Packs</span>
      </button>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-2" style={{ backgroundColor: pack.course?.color || '#6366f1' }} />

        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wide">
                  {pack.course?.code || 'Course'}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold capitalize">
                  {assignmentTypeLabel}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-800">{pack.title}</h1>
                <p className="text-gray-500 mt-2 max-w-3xl">{pack.summary}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span>{pack.course?.name || 'Synced course'}</span>
                <span>•</span>
                <span>{pack.course?.instructor || 'Instructor unavailable'}</span>
                <span>•</span>
                <span>{buildDueLabel(pack.dueAt)}</span>
                <span>•</span>
                <span>{formatDateTime(pack.dueAt)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <span className={`px-3 py-2 rounded-xl text-sm font-semibold border ${assignmentTone}`}>
                {assignmentStatus.replace('_', ' ')}
              </span>
              <div className="flex flex-wrap gap-3 xl:justify-end">
                <button
                  onClick={() => updateAssignmentStatus(pack.sourceId, 'in_progress')}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => updateAssignmentStatus(pack.sourceId, 'submitted')}
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                >
                  Mark Submitted
                </button>
                <button
                  onClick={handleCreateDeck}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  {pack.linkedDeckId ? 'Open Deck' : 'Create Deck'}
                </button>
                <button
                  onClick={() =>
                    openProfessor({
                      subject: pack.course?.id || pack.course?.name || '',
                      prompt: `I am working on ${pack.assignment?.title || pack.title}. Help me figure out the best next step and what I should understand before I move on.`,
                    })
                  }
                  className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Ask Professor
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Pack progress"
              value={`${pack.progressPercent}%`}
              detail={`${pack.completedCount}/${pack.totalChecklistItems} checklist steps done`}
              tone="emerald"
            />
            <StatTile
              label="Focus block"
              value={`${pack.recommendedSessionMinutes} min`}
              detail={`Built for your ${focusMinutes} minute mode setting`}
              tone="indigo"
            />
            <StatTile
              label="Files ready"
              value={pack.relatedFiles.length}
              detail="Lecture materials available"
              tone="slate"
            />
            <StatTile
              label="Review status"
              value={pack.reviewAvailable ? 'Open' : 'Pending'}
              detail={pack.reviewAvailable ? 'Assessment review is available' : 'Waiting on LMS review access'}
              tone={pack.reviewAvailable ? 'amber' : 'slate'}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-gray-100 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Checklist</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Work the pack one step at a time so the assignment stays manageable.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  {pack.completedCount}/{pack.totalChecklistItems} complete
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {pack.checklistItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleStudyPackChecklistItem(pack.id, item.label)}
                    className={`w-full text-left rounded-2xl border px-4 py-4 transition-colors ${
                      item.completed
                        ? 'border-emerald-100 bg-emerald-50'
                        : 'border-gray-100 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          item.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-gray-400 border border-gray-200'
                        }`}
                      >
                        {item.completed ? '✓' : '○'}
                      </span>
                      <div>
                        <p className={`font-medium ${item.completed ? 'text-emerald-800' : 'text-gray-800'}`}>
                          {item.label}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.completed ? 'Completed and saved in this pack.' : 'Tap to mark this step done.'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-gray-100 p-5">
                <h2 className="text-xl font-bold text-gray-800">Review focus</h2>
                <p className="text-sm text-gray-500 mt-1">{pack.reviewSummary}</p>

                {pack.weakTopics?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {pack.weakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-4">No weak areas have been flagged yet.</p>
                )}

                {pack.assignment?.description && (
                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Assignment context
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{pack.assignment.description}</p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-gray-100 p-5">
                <h2 className="text-xl font-bold text-gray-800">Quick reflection</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Leave yourself one note about what still feels confusing or what to tackle next.
                </p>
                <textarea
                  key={`${pack.id}-${pack.focusReflection || ''}`}
                  defaultValue={pack.focusReflection || ''}
                  onBlur={(event) => updateStudyPackReflection(pack.id, event.target.value)}
                  placeholder="Example: I still need to review the membrane transport diagrams before I feel ready."
                  className="mt-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 min-h-32 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-gray-100 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Course materials</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Files already synced into this course workspace.
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(pack.course?.id ? `/courses/${pack.course.id}` : '/courses')
                  }
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Open course
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {pack.relatedFiles.length > 0 ? (
                  pack.relatedFiles.map((file) => (
                    <div key={file.id} className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="font-medium text-gray-800">{file.title}</p>
                      <p className="text-sm text-gray-500 capitalize mt-1">{file.kind}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No synced files are attached to this course yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-100 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Flashcard starter set</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    A quick launch point for spaced repetition from this pack.
                  </p>
                </div>
                <button
                  onClick={handleCreateDeck}
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                >
                  {pack.linkedDeckId ? 'Open Deck' : 'Create Deck'}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {pack.flashcards.map((card) => (
                  <div key={card.front} className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="font-medium text-gray-800">{card.front}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.back}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
