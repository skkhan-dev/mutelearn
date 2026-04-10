# MuteLearn

MuteLearn is an adaptive study app designed around neurodivergent learning support. The app personalizes study timing, task chunking, interface focus, reminders, and accessibility defaults by learner profile, then layers in school workflow data so assignments and exams can become guided study actions instead of scattered stress.

## What is implemented

- Cognitive-profile onboarding for ADHD, dyslexia, ADD, and standard learners
- Adaptive dashboard, timers, flashcards, quizzes, games, pacing, and Professor chat
- Canvas-style demo LMS sync stored locally or through the local API
- Canvas OAuth callback handling and live server-side sync for courses, assignments, files, and grades
- File-backed local backend state for dev sessions, connector auth state, and recent sync-job history
- Background Canvas sync jobs with a saved Canvas state snapshot for the frontend to reload
- Course pages with synced assignments, files, and grade snapshots
- Adaptive planner with due-date triage and mode-aware chunk suggestions
- Auto-generated study packs that can create flashcard decks
- Professor prompt context enriched with weak areas and upcoming deadlines
- Local API scaffolding for dev sessions, connector status, Canvas OAuth, sync fallback, and basic job tracking

## Key routes

- `/dashboard`
- `/planner`
- `/courses`
- `/study-packs`
- `/flashcards`
- `/quizzes`

## Development

```bash
npm install
npm run api
npm run dev
```

You can also copy `.env.example` to `.env` and add your Canvas base URL, client ID, client secret, and redirect URI when you are ready to test the live connector.

## Live Canvas flow

1. Create a dev session from `/settings`
2. Add Canvas OAuth values in `.env`
3. Click `Connect Canvas`
4. Complete the OAuth window
5. Return to the app and click `Sync Canvas`

Local backend state is stored at `server/data/local-state.json` so sessions, recent sync activity, and the latest Canvas snapshot survive an API restart during development.

## Verification

```bash
npm run build
```

`npm run lint` still reports legacy issues in older game and pacing components that predate the LMS workflow work.

## Notes

- The current LMS implementation uses a local Canvas-style demo sync so the workflow can be exercised without institution credentials.
- A production rollout would move LMS auth, token handling, sync jobs, and AI orchestration to a backend service.
