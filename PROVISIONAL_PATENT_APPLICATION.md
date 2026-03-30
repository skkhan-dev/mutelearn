# PROVISIONAL PATENT APPLICATION

## UNITED STATES PATENT AND TRADEMARK OFFICE

### PROVISIONAL APPLICATION FOR PATENT

---

**Filing Date:** [TO BE FILLED BY ATTORNEY]

**Inventor(s):** Shahir Khan

**Title of Invention:**

# ADAPTIVE LEARNING INTERFACE SYSTEM WITH COGNITIVE PROFILE-DRIVEN PARAMETER MODULATION FOR NEURODIVERGENT USERS

---

## 1. FIELD OF THE INVENTION

The present invention relates generally to computer-implemented educational technology systems, and more specifically to an adaptive learning platform that dynamically modifies user interface presentation, study session parameters, content delivery timing, gamification reward structures, spaced repetition algorithm inputs, accessibility tool activation, and attentional intervention mechanisms based on a user's declared cognitive profile, including but not limited to Attention Deficit Hyperactivity Disorder (ADHD), Dyslexia, and Attention Deficit Disorder (ADD).

---

## 2. BACKGROUND OF THE INVENTION

### 2.1 Problem Statement

Existing digital learning platforms employ a one-size-fits-all approach to content presentation and study session management. While some platforms offer accessibility features (e.g., font size adjustment, dark mode) or study technique variations (e.g., spaced repetition, Pomodoro timers), these features operate independently and require manual configuration by the user. No existing system holistically adapts the entire learning experience — including session timing, content chunking, algorithm parameters, reward structures, UI layout, attentional interventions, and accessibility defaults — based on a user's cognitive profile.

### 2.2 Limitations of Prior Art

Prior art in educational technology suffers from the following limitations:

1. **Isolated Feature Adaptation**: Existing systems may adjust a single parameter (e.g., font size for dyslexia) but do not propagate cognitive profile information across all system subsystems simultaneously.

2. **Manual Configuration Burden**: Users with cognitive differences such as ADHD are required to manually discover and configure optimal settings across multiple independent feature controls, which is itself a task that their condition makes difficult.

3. **Uniform Reward Structures**: Gamification systems in existing learning platforms apply identical reward scales regardless of the cognitive effort required by different user populations to complete the same task.

4. **Absence of Proactive Attentional Intervention**: No existing system monitors user engagement patterns and delivers mode-specific interventions (e.g., encouraging nudges for ADD, single-task focus enforcement for ADHD) as part of an integrated cognitive support framework.

5. **Disconnected Accessibility Tools**: Text-to-speech, reading rulers, and color overlays exist as standalone browser extensions or application add-ons but are not integrated into the learning workflow or automatically activated based on cognitive profile.

---

## 3. SUMMARY OF THE INVENTION

The invention is a computer-implemented adaptive learning system comprising a **Cognitive Profile Context Engine** that receives a user's declared cognitive profile during onboarding and propagates profile-specific parameter sets across all system subsystems through a hierarchical context provider architecture. The system modulates at least seven interdependent subsystems simultaneously:

1. **Study Session Timing Subsystem** — Adjusts focus duration, break intervals, and session-to-break ratios
2. **Content Chunking Subsystem** — Modifies items-per-session limits and difficulty granularity levels
3. **Spaced Repetition Parameter Subsystem** — Adjusts quality-to-score mapping scales based on difficulty level count
4. **Gamification Reward Subsystem** — Applies profile-specific XP multipliers to compensate for differential cognitive effort
5. **User Interface Layout Subsystem** — Toggles between multi-element and single-task-focused presentations
6. **Attentional Intervention Subsystem** — Activates idle detection, focus guards, and proactive engagement nudges
7. **Accessibility Defaults Subsystem** — Pre-activates text-to-speech, reading rulers, and color overlays based on profile

The key innovation is the **single-selection cognitive profile mechanism** that triggers simultaneous, coordinated adaptation across all seven subsystems, eliminating the configuration burden on neurodivergent users while maintaining the ability to override individual parameters.

---

## 4. DETAILED DESCRIPTION OF THE INVENTION

### 4.1 System Architecture

The system is implemented as a client-side web application with the following hierarchical context provider architecture:

```
Application Root
  |
  +-- UserProvider (stores cognitive profile, onboarding state, grade level)
  |     |
  |     +-- ModeProvider (active mode, computed modeConfig, custom overrides)
  |           |
  |           +-- StudyProvider (decks, cards, notes, quiz history)
  |           |     |
  |           |     +-- GamificationProvider (XP, levels, badges, streaks)
  |           |           |
  |           |           +-- FocusGuardProvider (conditional, ADHD-only)
  |           |                 |
  |           |                 +-- [Application Routes and Components]
```

Each provider in the hierarchy has access to the cognitive mode context and can read profile-specific parameters to adjust its behavior. This architecture ensures that a single mode selection propagates to every functional subsystem without requiring explicit wiring between unrelated features.

### 4.2 Cognitive Profile Onboarding System

The system captures the user's cognitive profile through a multi-step onboarding wizard:

**Step 1 — Identity Capture**: User provides display name (stored for personalization).

**Step 2 — Academic Level Selection**: User selects grade level from predefined categories (Middle School grades 6-8, High School grades 9-12, College). This informs content complexity expectations.

**Step 3 — Cognitive Profile Selection**: User selects one of four profiles:

| Profile | Label | Description Presented to User |
|---------|-------|------------------------------|
| `adhd` | ADHD | "Short sessions, extra rewards, focused single-task view" |
| `dyslexia` | Dyslexia | "Easy-read fonts, text-to-speech, warm color overlay" |
| `add` | ADD | "Structured flow, task chunking, gentle reminders" |
| `default` | Default | "Just the basics — standard study experience" |

Upon selection, the system executes:
1. Persists profile selection to local storage key `mutelearn-mode`
2. Computes merged configuration: `modeConfig = deepMerge(modeDefaults[selectedProfile], userOverrides[selectedProfile])`
3. Applies DOM-level CSS class `mode-{profile}` to document root element
4. Navigates user to adapted dashboard

### 4.3 Mode Configuration Parameter Tables

The following tables specify the exact parameter values for each cognitive profile across all subsystems.

#### 4.3.1 Study Session Timing Parameters

| Parameter | Default | ADHD | Dyslexia | ADD |
|-----------|---------|------|----------|-----|
| Focus Duration (minutes) | 25 | 10 | 20 | 20 |
| Short Break Duration (minutes) | 5 | 5 | 5 | 5 |
| Long Break Duration (minutes) | 15 | 15 | 15 | 15 |
| Sessions Before Long Break | 4 | 3 | 4 | 4 |

**Rationale**: The ADHD profile reduces focus duration by 60% (25 to 10 minutes) and triggers long breaks after 3 sessions instead of 4, accommodating shorter sustained attention windows while maintaining the structured break pattern that supports executive function.

#### 4.3.2 Content Chunking Parameters

| Parameter | Default | ADHD | Dyslexia | ADD |
|-----------|---------|------|----------|-----|
| Cards Per Session | 20 | 6 | 10 | 12 |
| Difficulty Levels | 5 | 3 | 3 | 4 |

**Rationale**: The ADHD profile reduces cards per session by 70% (20 to 6), preventing overwhelm. Difficulty levels are reduced from 5 to 3 for ADHD and Dyslexia profiles, simplifying the self-assessment decision and reducing cognitive load during the rating step.

#### 4.3.3 Spaced Repetition Algorithm Interaction

The system implements the SuperMemo-2 (SM-2) spaced repetition algorithm with the following per-card data structure:

```
{
  interval: Number,        // days until next review
  repetition: Number,      // count of successful reviews
  efactor: Number,         // easiness factor, initial value 2.5
  dueDate: ISO timestamp,  // computed next review date
  lastReviewed: timestamp  // last review timestamp
}
```

The cognitive profile affects SM-2 interaction through the **quality mapping vector**, which translates the user's button press to the SM-2 quality score (0-5 scale):

| Difficulty Levels | Button Labels | Quality Mapping Vector |
|-------------------|--------------|----------------------|
| 3 (ADHD, Dyslexia) | Again, Got It, Easy! | [1, 3, 5] |
| 4 (ADD) | Again, Hard, Good, Easy | [1, 2, 4, 5] |
| 5 (Default) | Again, Hard, Good, Easy, Perfect | [0, 1, 3, 4, 5] |

**Innovation**: By reducing the number of self-assessment options for ADHD and Dyslexia profiles, the system reduces decision fatigue during the review step while still providing sufficient granularity for the SM-2 algorithm to compute meaningful interval adjustments. The mapping vectors are designed to preserve the algorithm's sensitivity at the critical boundaries (quality < 3 triggers interval reset) while reducing the number of decisions the user must make.

#### 4.3.4 Gamification Reward Scaling

| Parameter | Default | ADHD | Dyslexia | ADD |
|-----------|---------|------|----------|-----|
| XP Per Card Reviewed | 10 | 15 | 10 | 10 |
| XP Per Study Session | 30 | 50 | 40 | 40 |
| XP Per Quiz Completed | 25 | 40 | 30 | 30 |
| XP Per Game Completed | 20 | 35 | 25 | 25 |

**Innovation**: The ADHD profile applies XP multipliers ranging from 1.5x to 1.75x across all reward categories. This compensates for the reduced session sizes (fewer cards per session means fewer opportunities to earn XP) and provides the heightened dopaminergic reward feedback that ADHD learners require for sustained motivation. The reward scaling is calibrated such that a user in ADHD mode completing their reduced-size session (6 cards) earns comparable total XP to a Default mode user completing their full-size session (20 cards), maintaining perceived progress parity across profiles.

#### 4.3.5 User Interface Layout Parameters

| Parameter | Default | ADHD | Dyslexia | ADD |
|-----------|---------|------|----------|-----|
| Single Task View | false | **true** | false | false |
| Show Sidebar | true | **false** | true | true |
| Session Planner | false | false | false | **true** |
| Idle Timeout (seconds) | 0 | 0 | 0 | **120** |

**Innovation**: The ADHD profile activates a **Focus Guard** — a full-screen single-task interface that removes all navigation elements, sidebars, and secondary content, presenting only the current study card with a progress indicator. This reduces visual distraction and prevents task-switching behavior. The ADD profile enables a **Session Planner** that provides structured task sequencing and an **Idle Timeout** that triggers engagement nudges after 120 seconds of inactivity.

#### 4.3.6 Accessibility Default Parameters

| Parameter | Default | ADHD | Dyslexia | ADD |
|-----------|---------|------|----------|-----|
| TTS Enabled | false | false | **true** | false |
| Reading Ruler Available | false | false | **true** | false |
| Color Overlay Available | false | false | **true** | false |
| Idle Nudge Enabled | false | false | false | **true** |
| Break Suggestions | none | **10 physical activities** | none | none |

### 4.4 Focus Guard Subsystem (ADHD-Specific)

When the ADHD cognitive profile is active and `singleTaskView` is enabled, the system activates the Focus Guard subsystem, which:

1. Renders a full-screen centered layout (maximum width constraint of 672px)
2. Displays a fixed progress bar at the top of the viewport showing session completion percentage
3. Removes all navigation elements, sidebar content, and secondary UI elements
4. Presents only the current study card in the center of the viewport
5. Provides a semi-transparent exit button in the top-right corner to allow the user to voluntarily exit focus mode
6. Wraps all child content in the focused layout via a React context provider pattern

The Focus Guard is architecturally distinct from simple "full screen mode" because it:
- Is **automatically activated** based on cognitive profile (not manually toggled)
- Removes **application-level** navigation (not just browser chrome)
- Maintains **progress visibility** while removing all other visual elements
- Is **integrated with the session lifecycle** (activates during study, deactivates on completion)

### 4.5 Idle Detection and Nudge Subsystem (ADD-Specific)

When the ADD cognitive profile is active and `idleTimeout` is set to a non-zero value (default: 120 seconds), the system activates the Idle Detection subsystem, which:

1. Registers passive event listeners for the following user activity signals: `mousemove`, `click`, `scroll`, `keypress`, `touchstart`
2. Maintains a timeout counter that resets to zero upon any detected activity
3. Upon timeout expiration (120 seconds of inactivity), selects a random encouragement message from a predefined set:
   - "Still working? Take your time"
   - "No rush — you're doing great"
   - "Whenever you're ready, you've got this"
   - "A small step still counts"
   - "It's okay to pause and think"
4. Displays the message as a non-blocking, semi-transparent notification at the bottom-center of the viewport
5. The notification is dismissible by click and auto-dismisses when activity resumes
6. The idle counter immediately resets upon any detected activity

**Innovation**: Unlike intrusive alert dialogs or session timeout mechanisms in prior art, this subsystem uses **non-judgmental, encouraging language** specifically designed for ADD users who may experience guilt or anxiety about task avoidance. The messages are psychologically calibrated to reduce shame while gently redirecting attention to the study task. The notification is intentionally **non-blocking** (pointer-events: none on overlay areas) to avoid creating an additional task (dismissing the notification) that could further impede task resumption.

### 4.6 Overload Study Mode with Milestone Rewards

The system includes an intensive study mode ("Overload") that presents all cards in a deck for rapid binary classification (known/unknown), with unknown cards automatically re-entering the review queue. The system tracks elapsed study time and awards bonus XP at predetermined milestones:

| Milestone | Time | Bonus XP |
|-----------|------|----------|
| 1 | 10 minutes | 20 XP |
| 2 | 30 minutes | 50 XP |
| 3 | 60 minutes | 100 XP |
| 4 | 90 minutes | 150 XP |
| 5 | 120 minutes | 200 XP |

Per-card rewards: Known = 5 XP, Unknown = 2 XP.

### 4.7 Multi-Source Content Ingestion Pipeline

The system supports study material creation from multiple input modalities:

1. **Camera Capture**: Device camera captures images of physical study materials (textbooks, handwritten notes, whiteboards)
2. **Audio Recording**: Microphone captures lecture audio for transcription
3. **Video Import**: Video files processed for content extraction
4. **Manual Text Entry**: Direct text input with rich formatting

Ingested content is processed into a normalized study card format (`{ term, definition, tags[], deckId }`) and immediately becomes available across all study subsystems (flashcards, quizzes, games), with presentation adapted to the active cognitive profile.

### 4.8 Adaptive Game Mechanics

The system includes six study games, each of which adapts its behavior and reward structure based on the active cognitive profile:

1. **Match Madness** — Term-definition matching with XP scaled by accuracy
2. **Memory Grid** — Tile-flip memory matching (limited to 6 pairs to prevent overwhelm)
3. **Fill the Gap** — Definition-to-term recall with text input
4. **Term Scramble** — Letter rearrangement for spelling reinforcement
5. **Speed Round** — Timed true/false assessment
6. **Boss Battle** — Narrative-driven quiz with health bar mechanics

All games share a common results framework with letter grades (S/A/B/C/D) and mode-specific XP awards. The ADHD profile awards 75% more XP per game (35 vs 20 base) to maintain engagement through heightened reward feedback.

### 4.9 CSS Custom Property Mode Propagation

The system applies a CSS class to the document root element (`mode-adhd`, `mode-dyslexia`, `mode-add`, `mode-default`) that enables cascading style modifications through CSS custom properties:

```css
:root {
  --font-size-card: 1.25rem;
  --bg-main: #f9fafb;
  --accent: #6366f1;
}

.mode-dyslexia {
  --font-size-card: 1.5rem;  /* 20% larger text */
}

.mode-adhd {
  --bg-main: #fff9f0;  /* Warmer background to reduce visual harshness */
}
```

This enables visual adaptations to propagate to all components without requiring each component to explicitly check the cognitive profile, implementing the **separation of behavioral adaptation** (handled by JavaScript context) **from visual adaptation** (handled by CSS cascade).

### 4.10 Accessibility Tool Stack

#### 4.10.1 Text-to-Speech Engine

Utilizes the Web Speech API (`window.speechSynthesis`) with the following capabilities:
- Speed control: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x
- Play/pause toggle with visual state indication
- Contextual activation: appears inline on flashcards, quiz questions, and game prompts
- Auto-enabled for Dyslexia profile; opt-in for all other profiles

#### 4.10.2 Reading Ruler

A visual overlay that follows the user's cursor position, darkening text above and below a configurable focal zone:
- Focal zone heights: 32px (1 line), 56px (2 lines), 80px (3 lines)
- Darkening implemented as semi-transparent black overlays (30% opacity) on non-focal regions
- Ruler edges marked with accent-colored border lines (40% opacity)
- Tracks both mouse (mousemove) and touch (touchmove) input
- Rendered as a non-interactive overlay (pointer-events: none) to avoid interfering with study interactions

#### 4.10.3 Color Overlay

A full-viewport semi-transparent color filter designed to reduce visual stress:
- Four color options: Warm Yellow (#fef3c7), Light Blue (#dbeafe), Light Green (#d1fae5), Light Pink (#fce7f3)
- User-adjustable opacity: 10% to 40% via slider control
- Rendered at z-index 9998 with pointer-events: none
- Persisted to local storage for cross-session consistency

---

## 5. CLAIMS

### Independent Claims

**Claim 1.** A computer-implemented method for adaptive learning comprising:
- (a) receiving, via a graphical user interface, a user's selection of a cognitive profile from a predefined set of profiles including at least a default profile and one or more neurodivergent profiles;
- (b) computing, by a processor, a unified configuration object by merging profile-specific default parameters with any user-customized overrides;
- (c) simultaneously propagating said configuration object to a plurality of interdependent learning subsystems including at least: (i) a study session timing subsystem, (ii) a content chunking subsystem, (iii) a spaced repetition algorithm subsystem, (iv) a gamification reward subsystem, and (v) a user interface layout subsystem;
- (d) each of said subsystems reading profile-specific parameters from said configuration object and modifying its behavior accordingly; and
- (e) whereby a single user selection in step (a) causes coordinated behavioral adaptation across all of said subsystems without requiring the user to independently configure each subsystem.

**Claim 2.** A computer-implemented system for cognitive profile-aware learning, the system comprising:
- a cognitive profile context engine configured to store a user's declared cognitive profile and compute a hierarchical configuration object;
- a study session timing module configured to adjust focus duration, break intervals, and session-to-break ratios based on said configuration object;
- a content chunking module configured to adjust items-per-session limits and self-assessment granularity levels based on said configuration object;
- a spaced repetition module implementing a modified SM-2 algorithm wherein the quality mapping vector is determined by the number of difficulty levels specified in said configuration object;
- a gamification module configured to apply profile-specific experience point multipliers to study activities based on said configuration object;
- a user interface layout module configured to selectively enable or disable interface elements including navigation, sidebar, and single-task focus mode based on said configuration object; and
- an attentional intervention module configured to selectively activate idle detection, engagement nudges, or focus guard constraints based on said configuration object.

**Claim 3.** A computer-implemented method for reducing cognitive load in neurodivergent learners, comprising:
- (a) presenting a cognitive profile selection interface during a user onboarding process;
- (b) upon selection of an ADHD profile: simultaneously reducing study session focus duration by at least 50%, reducing items per study session by at least 60%, activating a single-task focus guard that removes navigation and sidebar elements, increasing experience point rewards by at least 40%, and reducing self-assessment difficulty levels to three or fewer options;
- (c) upon selection of a Dyslexia profile: automatically enabling text-to-speech functionality, making available a reading ruler overlay and color filter overlay, and reducing self-assessment difficulty levels to three or fewer options;
- (d) upon selection of an ADD profile: activating an idle detection system that monitors user activity signals and presents non-blocking encouragement notifications after a predetermined inactivity threshold, and enabling a session planner interface;
- whereby each profile selection in steps (b), (c), or (d) triggers coordinated changes across timing, content, rewards, interface, and accessibility subsystems through a single configuration propagation mechanism.

### Dependent Claims

**Claim 4.** The method of Claim 1, wherein the spaced repetition algorithm subsystem implements a quality mapping vector that translates user button presses to algorithm quality scores, wherein the length of said vector equals the number of difficulty levels specified by the active cognitive profile, and wherein:
- a 3-level profile maps user responses to quality scores [1, 3, 5];
- a 4-level profile maps user responses to quality scores [1, 2, 4, 5]; and
- a 5-level profile maps user responses to quality scores [0, 1, 3, 4, 5].

**Claim 5.** The method of Claim 1, wherein the gamification reward subsystem applies profile-specific experience point multipliers such that a user completing a reduced-size study session under a neurodivergent profile earns comparable total experience points to a user completing a full-size session under the default profile, thereby maintaining perceived progress parity across cognitive profiles.

**Claim 6.** The system of Claim 2, wherein the attentional intervention module, when the ADD cognitive profile is active, monitors at least five user activity signals (mouse movement, click, scroll, key press, and touch start) via passive event listeners, and upon detecting inactivity exceeding 120 seconds, displays a randomly selected non-blocking encouragement message positioned at the bottom-center of the viewport, said message being dismissible by user click and auto-dismissing upon detection of resumed activity.

**Claim 7.** The system of Claim 2, wherein the user interface layout module, when the ADHD cognitive profile is active, renders a focus guard comprising:
- a full-screen centered content area with constrained maximum width;
- a fixed progress indicator displaying session completion percentage;
- removal of all navigation elements, sidebar content, and secondary interface elements;
- a semi-transparent exit control allowing voluntary deactivation;
- said focus guard being automatically activated upon entering a study session and deactivated upon session completion.

**Claim 8.** The method of Claim 1, further comprising a CSS custom property propagation mechanism wherein:
- a CSS class corresponding to the active cognitive profile is applied to the document root element;
- visual adaptation parameters including font size, background color, and accent color are defined as CSS custom properties with profile-specific overrides;
- whereby visual adaptations propagate to all interface components through the CSS cascade without requiring each component to explicitly query the cognitive profile.

**Claim 9.** The system of Claim 2, further comprising an overload study mode that presents all cards for binary classification (known/unknown) with automatic re-queuing of unknown cards, tracks elapsed study time, and awards predetermined bonus experience points at milestone intervals of 10, 30, 60, 90, and 120 minutes.

**Claim 10.** The method of Claim 3, further comprising a multi-source content ingestion pipeline that accepts study material from camera capture, audio recording, video import, and manual text entry, normalizes said material into a structured card format, and immediately makes said cards available across all study subsystems with presentation adapted to the active cognitive profile.

---

## 6. ABSTRACT

An adaptive learning platform that dynamically modifies its entire user experience based on a learner's declared cognitive profile. Upon a single profile selection during onboarding (ADHD, Dyslexia, ADD, or Default), the system simultaneously adjusts study session timing (e.g., 60% shorter focus periods for ADHD), content chunking (e.g., 70% fewer cards per session), spaced repetition algorithm parameters (e.g., reduced self-assessment granularity), gamification reward scaling (e.g., 50-75% XP boost for ADHD), user interface layout (e.g., single-task focus guard), attentional interventions (e.g., idle detection with encouraging nudges for ADD), and accessibility tool defaults (e.g., auto-enabled text-to-speech for Dyslexia). A hierarchical context provider architecture propagates the cognitive profile configuration to all subsystems through a unified configuration object, eliminating the need for neurodivergent users to independently discover and configure optimal settings across multiple features. The system further includes an overload study mode with milestone-based rewards, six adaptive study games, and a multi-source content ingestion pipeline, all responsive to the active cognitive profile.

---

## 7. DRAWINGS

*[Note to Attorney: The following figures should be prepared as formal patent drawings]*

**Figure 1** — System architecture diagram showing hierarchical context provider chain (UserProvider > ModeProvider > StudyProvider > GamificationProvider > FocusGuardProvider)

**Figure 2** — Onboarding wizard flow diagram (3 steps: Name > Grade Level > Cognitive Profile Selection)

**Figure 3** — Mode configuration propagation flowchart showing single selection branching to 7 subsystems

**Figure 4** — Focus Guard UI layout (ADHD mode) showing full-screen single-card view with progress bar

**Figure 5** — Idle Detection state machine diagram showing activity monitoring, timeout trigger, nudge display, and reset cycle

**Figure 6** — Comparison table of parameter values across all four cognitive profiles

**Figure 7** — Spaced repetition quality mapping vectors for 3-level, 4-level, and 5-level difficulty configurations

**Figure 8** — Gamification XP flow diagram showing mode-specific multipliers applied at card, session, quiz, and game completion events

**Figure 9** — Accessibility tool stack diagram showing TTS, Reading Ruler, and Color Overlay integration points

**Figure 10** — Overload Study Mode flowchart showing card classification loop, re-queuing mechanism, and milestone reward triggers

---

## 8. INVENTOR DECLARATION

I, the undersigned inventor, declare that:

1. I am the original inventor of the subject matter described in this provisional application.
2. I have reviewed and understand the contents of this application.
3. I acknowledge that this provisional application establishes a priority date but does not itself mature into a patent without the filing of a non-provisional application within 12 months.

**Inventor Signature:** ____________________________

**Inventor Name (Printed):** Shahir Khan

**Date:** ____________________________

---

## 9. NOTES FOR PATENT ATTORNEY

### Prior Art Considerations

The following elements are individually known in the prior art and should NOT be claimed independently:
- SM-2 spaced repetition algorithm (Piotr Wozniak, 1987)
- Pomodoro Technique (Francesco Cirillo, 1980s)
- Gamification in education (general)
- Text-to-speech accessibility
- Flashcard study systems

### Novelty Argument

The novelty lies in the **integrated, simultaneous adaptation of all subsystems based on a single cognitive profile selection**. No prior art system:
1. Uses a cognitive profile to modulate spaced repetition quality mapping vectors
2. Automatically scales gamification rewards based on cognitive profile to maintain progress parity
3. Integrates attentional intervention mechanisms (focus guard, idle nudge) as part of the learning platform rather than as separate accessibility tools
4. Propagates a single profile selection to simultaneously affect timing, content, algorithm, rewards, layout, interventions, and accessibility through a unified configuration architecture

### Recommended Search Classes

- CPC: G09B 5/00 (Electrically-operated educational appliances)
- CPC: G09B 7/00 (Electrically-operated teaching apparatus)
- CPC: G06F 3/01 (Input arrangements for user-computer interaction, adaptive interfaces)
- CPC: G16H 20/70 (ICT specially adapted for therapies or health-improving plans relating to mental health)

### Filing Recommendations

1. **File provisional immediately** to establish priority date
2. Consider **continuation-in-part** if AI-powered content generation features are added
3. Explore **design patent** for the Focus Guard single-task UI layout
4. Consider **international PCT filing** within 12 months if commercial traction is demonstrated
5. The 12-month provisional period expires on [FILING DATE + 12 months] — non-provisional must be filed before then

---

*This document is intended as a draft for review by a registered patent attorney. It does not constitute legal advice. A qualified patent attorney should review all claims, conduct a formal prior art search, and prepare formal drawings before filing.*
