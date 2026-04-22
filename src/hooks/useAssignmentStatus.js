import { useCallback, useState } from 'react';
import { useLMS } from '../contexts/LMSContext';
import { useGamification } from '../contexts/GamificationContext';

const XP_BY_TYPE = { exam: 50, quiz: 35, assignment: 25, reading: 15 };

// Shared handler for the Overdue / Late / Completed status transitions.
// Centralizes XP awards so Course Detail, /courses, and Dashboard all behave
// the same way when a student marks an assignment done.
export function useAssignmentStatus() {
  const { completeAssignment, updateAssignmentStatus } = useLMS();
  const { addXP } = useGamification();
  const [completedToast, setCompletedToast] = useState(null);

  const markStatus = useCallback(
    (assignment, nextStatus) => {
      if (!assignment) return;

      if (nextStatus === 'completed') {
        completeAssignment(assignment.id);
        const xp = XP_BY_TYPE[assignment.type] || 25;
        addXP(xp, `Completed: ${assignment.title}`);
        setCompletedToast({ title: assignment.title, xp });
        setTimeout(() => setCompletedToast(null), 3000);
        return;
      }

      if (nextStatus === 'late') {
        // completeAssignment sets completedAt for us; then override to 'late'
        // so we can still distinguish late turn-ins in the Done section.
        completeAssignment(assignment.id);
        updateAssignmentStatus(assignment.id, 'late');
        const xp = Math.round((XP_BY_TYPE[assignment.type] || 25) * 0.5);
        addXP(xp, `Turned in late: ${assignment.title}`);
        setCompletedToast({ title: `${assignment.title} (late)`, xp });
        setTimeout(() => setCompletedToast(null), 3000);
        return;
      }

      updateAssignmentStatus(assignment.id, nextStatus);
    },
    [addXP, completeAssignment, updateAssignmentStatus]
  );

  return { markStatus, completedToast, clearToast: () => setCompletedToast(null) };
}
