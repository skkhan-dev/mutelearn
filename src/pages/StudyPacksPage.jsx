import { useNavigate } from 'react-router-dom';
import { useLMS } from '../contexts/LMSContext';
import { useStudy } from '../contexts/StudyContext';
import { buildDueLabel, formatDateTime } from '../lib/dateUtils';

export default function StudyPacksPage() {
  const navigate = useNavigate();
  const { isCanvasConnected, connectCanvasDemo, studyPacks, linkStudyPackDeck } = useLMS();
  const { createDeck, addCardsFromImport } = useStudy();

  const handleCreateDeck = (pack) => {
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
          <h1 className="text-3xl font-bold text-gray-800">Study Packs</h1>
          <p className="text-gray-500 max-w-2xl mx-auto mt-2">
            Connect course data first and MuteLearn will build assignment and exam prep packs
            automatically.
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Study Packs</h1>
        <p className="text-gray-500 mt-1">
          Assignment and exam prep bundles generated from synced coursework.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {studyPacks.map((pack) => (
          <article
            key={pack.id}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {pack.course?.code || 'Course'}
                </p>
                <h2 className="text-2xl font-bold text-gray-800">{pack.title}</h2>
                <p className="text-sm text-gray-500 mt-2">{pack.summary}</p>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 inline-block">
                  {buildDueLabel(pack.dueAt)}
                </p>
                <p className="text-sm text-gray-400">{formatDateTime(pack.dueAt)}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-gray-800">Checklist</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-emerald-600 border border-emerald-100">
                    {pack.completedCount}/{pack.totalChecklistItems} complete
                  </span>
                </div>
                <div className="space-y-2">
                  {pack.checklistItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm text-gray-600">
                      <span>{item.completed ? '✓' : '•'}</span>
                      <span className={item.completed ? 'line-through text-gray-400' : ''}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-2 rounded-full bg-white overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${pack.progressPercent}%` }}
                  />
                </div>
              </section>

              <section className="rounded-2xl bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Review and weak areas</h3>
                <p className="text-sm text-gray-600">{pack.reviewSummary}</p>
                {pack.weakTopics?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {pack.weakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-3">No flagged weak areas yet.</p>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-gray-100 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Flashcard starter set</h3>
                  <p className="text-sm text-gray-500">
                    {pack.flashcards.length} cards ready to add to a deck
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/study-packs/${pack.id}`)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Open Pack
                  </button>
                  <button
                    onClick={() => handleCreateDeck(pack)}
                    className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                  >
                    {pack.linkedDeckId ? 'Open Deck' : 'Create Deck'}
                  </button>
                </div>
              </div>
            </section>
          </article>
        ))}
      </div>
    </div>
  );
}
