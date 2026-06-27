# Requirements Document

## Introduction

The Learning Hub & Progress module is a server-side feature for the LMS that provides students with a unified, real-time dashboard of their learning activity. It replaces all mock/static data with live database aggregations and exposes the data through a set of REST API endpoints. All progress-changing actions (watch time updates, lesson completions, quiz submissions, assignment submissions) emit Socket.IO events to the student's personal room so that any connected client reflects changes instantly.

The module builds on existing infrastructure: the `Enrollment`, `Course`, `User`, `QuizAttempt`, `Assignment`, and `Attendance` MongoDB models; the repository pattern already in use; Redis for caching; and the `getIO()` helper from `server/config/socket.js`.

---

## Glossary

- **Learning_Hub_Service**: The server-side service layer that computes and returns all Learning Hub metrics.
- **Progress_Repository**: The data-access layer responsible for all database queries needed by the Learning Hub.
- **Progress_Controller**: The HTTP controller that maps API routes to Learning_Hub_Service calls.
- **Socket_Emitter**: The component that calls `getIO()` and emits Socket.IO events to a student's personal room.
- **Student**: An authenticated user whose `role` is `STUDENT`.
- **Enrollment**: A MongoDB document linking a Student to a Course; contains `watchTimeSeconds`, `completedChapters`, `completedLessons`, `learningStreak`, `progress`, and `status`.
- **Learning_Heatmap**: A per-Student record of daily study activity (watch-time seconds) for each calendar day over the last 365 days.
- **Weekly_Goal**: A Student-defined weekly study-hour target stored on the Student's user document or a dedicated field, compared against actual hours studied in the current ISO week.
- **Milestone**: A named badge/achievement (e.g., "First Lesson Complete", "7-Day Streak", "Course Complete", "Quiz Master") awarded automatically when its condition is met.
- **Pacing**: The comparison of actual cumulative study hours against the expected hours derived from course deadlines and total estimated content duration.
- **Roadmap**: An ordered, status-annotated list of chapters and lessons for a specific Course, where each lesson is marked `completed`, `in-progress`, or `locked` relative to a Student's enrollment.
- **Personal_Room**: The Socket.IO room identified as `student:{studentId}` to which all real-time progress events for a given Student are emitted.

---

## Requirements

### Requirement 1: Learning Hub Dashboard Endpoint

**User Story:** As a Student, I want a single API call that returns all my Learning Hub metrics, so that the client can render the full dashboard without making multiple sequential requests.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/progress/hub` with a valid JWT, THE Progress_Controller SHALL return a JSON object containing: overall syllabus completion percentage, daily streak, weekly goal progress, total lessons finished count, study hour pacing status, current active course roadmap summary, learning heatmap data for the last 365 days, and earned milestones.
2. WHEN the Learning_Hub_Service assembles the hub response, THE Learning_Hub_Service SHALL retrieve all metrics from real database aggregations with no hardcoded or static data.
3. IF the Student has no active enrollments, THEN THE Progress_Controller SHALL return a 200 response with all numeric metrics set to zero and empty arrays for list-type metrics.
4. WHEN the hub data is successfully assembled, THE Progress_Controller SHALL cache the response in Redis with a TTL of 300 seconds using the key `hub:{studentId}`.
5. WHEN any progress-changing event invalidates the cached hub data, THE Learning_Hub_Service SHALL delete the `hub:{studentId}` Redis key.

---

### Requirement 2: Overall Syllabus Completion

**User Story:** As a Student, I want to see the percentage of my total enrolled course content I have completed, so that I understand my overall learning progress at a glance.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/progress/syllabus`, THE Progress_Controller SHALL return the total number of lessons across all active Enrollments, the number of those lessons the Student has completed, and the overall completion percentage rounded to two decimal places.
2. WHEN calculating the overall syllabus completion, THE Learning_Hub_Service SHALL count total lessons by summing `chapters[].lessons[]` arrays from all Courses for which the Student has an active Enrollment.
3. WHEN calculating lessons completed, THE Learning_Hub_Service SHALL count distinct lesson IDs present in `completedLessons` across all of the Student's active Enrollments.
4. IF a Student has zero total lessons across all active Enrollments, THEN THE Learning_Hub_Service SHALL return a completion percentage of 0.00.

---

### Requirement 3: Daily Learning Streak

**User Story:** As a Student, I want to track my consecutive days of learning activity, so that I stay motivated to log in and study every day.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/progress/streak`, THE Progress_Controller SHALL return the Student's current streak in days, longest-ever streak in days, and the date of the last recorded learning activity.
2. WHEN a Student's watch-time update or lesson completion is processed and the Student has not recorded any activity on the current calendar day (UTC), THE Learning_Hub_Service SHALL increment `learningStreak.currentStreak` by 1 and set `learningStreak.lastActivityDate` to the current UTC timestamp.
3. WHEN a Student's watch-time update or lesson completion is processed and the Student already recorded activity on the current calendar day (UTC), THE Learning_Hub_Service SHALL leave `learningStreak.currentStreak` unchanged.
4. WHEN a Student's watch-time update or lesson completion is processed and the Student's last activity was more than 48 hours ago, THE Learning_Hub_Service SHALL reset `learningStreak.currentStreak` to 1.
5. WHEN `learningStreak.currentStreak` exceeds `learningStreak.longestStreak`, THE Learning_Hub_Service SHALL update `learningStreak.longestStreak` to equal `learningStreak.currentStreak`.
6. WHEN the streak is updated, THE Socket_Emitter SHALL emit a `streak:updated` event to the Personal_Room containing the updated `currentStreak`, `longestStreak`, and `lastActivityDate`.

---

### Requirement 4: Weekly Study Goal

**User Story:** As a Student, I want to set a weekly study hour target and track my progress against it, so that I can maintain a consistent study schedule.

#### Acceptance Criteria

1. WHEN a Student sends `PUT /api/progress/weekly-goal` with a `targetHours` value between 1 and 168 inclusive, THE Progress_Controller SHALL persist the target on the Student's User document and return the updated goal object.
2. IF a Student sends `PUT /api/progress/weekly-goal` with a `targetHours` value less than 1 or greater than 168, THEN THE Progress_Controller SHALL return a 400 response with a descriptive validation error.
3. WHEN a Student sends `GET /api/progress/weekly-goal`, THE Progress_Controller SHALL return the `targetHours`, the total study hours logged in the current ISO calendar week (Monday 00:00 UTC to Sunday 23:59 UTC), the percentage of the goal achieved rounded to two decimal places, and a boolean `onTrack` that is `true` when the percentage is at or above the expected proportion for the current day of the week.
4. WHEN the weekly study hours are calculated, THE Learning_Hub_Service SHALL derive actual hours from the sum of all `watchTimeSeconds` increments recorded in Enrollment documents within the current ISO week.
5. WHEN a watch-time update causes the weekly actual hours to change, THE Socket_Emitter SHALL emit a `goal:updated` event to the Personal_Room containing the updated `actualHours`, `targetHours`, and `percentage`.

---

### Requirement 5: Lessons Finished

**User Story:** As a Student, I want to see how many individual lessons I have completed across all my courses, so that I have a concrete measure of my learning output.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/progress/lessons`, THE Progress_Controller SHALL return the total count of completed lessons and a list of completed lesson objects, each containing `lessonId`, `lessonTitle`, `courseId`, `courseTitle`, and `completedAt` if available.
2. WHEN a Student sends `POST /api/progress/:courseId/lesson/:lessonId/complete`, THE Progress_Controller SHALL mark the lesson as completed in the Student's Enrollment document if it is not already marked, update the Enrollment's `progress` percentage, and return the updated Enrollment.
3. WHEN a lesson is marked complete and the lesson was not previously in `completedLessons`, THE Learning_Hub_Service SHALL add the lesson ID to `completedLessons`, recalculate `progress` as `(completedLessons.length / totalLessons) * 100`, and persist the updated Enrollment.
4. IF a lesson ID is already present in `completedLessons`, THEN THE Learning_Hub_Service SHALL return the existing Enrollment without modification and without emitting a duplicate event.
5. WHEN a lesson is successfully marked complete, THE Socket_Emitter SHALL emit a `progress:updated` event to the Personal_Room containing the updated `completedLessons` count and `progress` percentage.

---

### Requirement 6: Study Hour Pacing

**User Story:** As a Student, I want to know whether my actual study hours are keeping pace with what is needed to finish my courses by their expected deadlines, so that I can adjust my study schedule proactively.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/progress/pacing`, THE Progress_Controller SHALL return a pacing object for each active Enrollment containing: `courseId`, `courseTitle`, `totalContentHours` (sum of `videoMetadata.durationSeconds` for all lessons divided by 3600, rounded to two decimal places), `studiedHours` (derived from `watchTimeSeconds` divided by 3600), `expectedHoursToDate` (computed from `totalContentHours` proportional to elapsed time since enrollment divided by the course duration), and a `status` field that is `"on-track"` when `studiedHours >= expectedHoursToDate * 0.9` and `"behind"` otherwise.
2. WHEN calculating `expectedHoursToDate`, THE Learning_Hub_Service SHALL use the Enrollment `createdAt` timestamp as the start date and the current date as the reference point against the total estimated content hours.
3. IF a Course has no lessons with `videoMetadata.durationSeconds` defined, THEN THE Learning_Hub_Service SHALL set `totalContentHours` to 0 and `status` to `"on-track"` for that Enrollment.

---

### Requirement 7: Course Roadmap

**User Story:** As a Student, I want to see an ordered list of chapters and lessons for a specific course, each with a completion status, so that I know exactly what to study next.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/progress/roadmap/:courseId`, THE Progress_Controller SHALL return an ordered array of chapters, each containing an ordered array of lessons with fields: `lessonId`, `title`, `type`, `order`, and `status` (`"completed"`, `"in-progress"`, or `"locked"`).
2. WHEN building the roadmap, THE Learning_Hub_Service SHALL mark a lesson as `"completed"` if its ID is in the Student's `completedLessons` for that Enrollment, `"in-progress"` if it is the first lesson not yet completed in the sequence, and `"locked"` for all subsequent lessons.
3. IF the Student is not enrolled in the specified course, THEN THE Progress_Controller SHALL return a 403 response with an appropriate error message.
4. IF the specified course does not exist, THEN THE Progress_Controller SHALL return a 404 response.

---

### Requirement 8: Learning Heatmap

**User Story:** As a Student, I want to see my daily study activity over the past year rendered as a heatmap, so that I can visualize patterns in my learning behavior.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/progress/heatmap`, THE Progress_Controller SHALL return an array of objects, each containing a `date` string in `YYYY-MM-DD` format and a `seconds` integer representing total watch-time seconds recorded on that day, covering the last 365 calendar days including days with zero activity.
2. WHEN building heatmap data, THE Learning_Hub_Service SHALL aggregate `watchTimeSeconds` increments from Enrollment update history grouped by UTC calendar day.
3. WHEN heatmap data is retrieved, THE Learning_Hub_Service SHALL cache the result in Redis with the key `heatmap:{studentId}` and a TTL of 600 seconds.
4. WHEN a watch-time update is processed, THE Learning_Hub_Service SHALL invalidate the `heatmap:{studentId}` Redis key and emit a `heatmap:updated` event to the Personal_Room containing the updated date entry.
5. THE Learning_Hub_Service SHALL include all 365 days in the response array even when a day has zero recorded watch time.

---

### Requirement 9: Milestones and Badges

**User Story:** As a Student, I want to earn badges and milestones automatically when I reach learning goals, so that I receive recognition for my achievements and stay motivated.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/progress/milestones`, THE Progress_Controller SHALL return a list of earned Milestones from the Student's `achievements` array on the User document, each containing `title`, `description`, `badgeUrl`, and `awardedAt`.
2. WHEN a Student completes their first lesson, THE Learning_Hub_Service SHALL check whether the "First Lesson Complete" milestone has been awarded and, if not, append it to the Student's `achievements` array and emit a `milestone:earned` event to the Personal_Room.
3. WHEN a Student's `learningStreak.currentStreak` reaches 7, THE Learning_Hub_Service SHALL check whether the "7-Day Streak" milestone has been awarded and, if not, append it to the Student's `achievements` array and emit a `milestone:earned` event to the Personal_Room.
4. WHEN a Student's Enrollment `progress` reaches 100, THE Learning_Hub_Service SHALL check whether the "Course Complete" milestone for that course has been awarded and, if not, append it to the Student's `achievements` array and emit a `milestone:earned` event to the Personal_Room.
5. WHEN a Student passes a quiz (QuizAttempt `passed` is `true`) and has passed 10 or more distinct quizzes, THE Learning_Hub_Service SHALL check whether the "Quiz Master" milestone has been awarded and, if not, append it to the Student's `achievements` array and emit a `milestone:earned` event to the Personal_Room.
6. WHEN a `milestone:earned` event is emitted, THE Socket_Emitter SHALL include the full Milestone object (`title`, `description`, `badgeUrl`, `awardedAt`) in the event payload.
7. THE Learning_Hub_Service SHALL ensure each Milestone title is awarded at most once per Student regardless of how many times the trigger condition is evaluated.

---

### Requirement 10: Watch-Time Update Enhancement

**User Story:** As a Student, I want my watch-time updates to be immediately reflected across all my connected devices, so that my progress is always current no matter where I am studying.

#### Acceptance Criteria

1. WHEN a Student sends `PUT /api/progress/:courseId/watch-time` with a valid `additionalSeconds` integer greater than 0, THE Progress_Controller SHALL add `additionalSeconds` to the Enrollment's `watchTimeSeconds`, update the streak, invalidate relevant caches, and return the updated Enrollment.
2. IF `additionalSeconds` is missing, not a number, or less than or equal to 0, THEN THE Progress_Controller SHALL return a 400 response with a descriptive validation error.
3. WHEN a watch-time update is persisted, THE Socket_Emitter SHALL emit a `progress:updated` event to the Personal_Room containing the updated `watchTimeSeconds` and the current `progress` percentage.
4. WHEN a watch-time update is persisted, THE Learning_Hub_Service SHALL record the increment in a per-day activity log used by the Learning Heatmap aggregation (keyed by UTC date string `YYYY-MM-DD` on the Enrollment or a dedicated daily-activity subdocument).

---

### Requirement 11: Real-Time Socket.IO Event Contract

**User Story:** As a client developer, I want a well-defined set of Socket.IO events emitted to a student's personal room, so that I can build reactive UI components that update without polling.

#### Acceptance Criteria

1. THE Socket_Emitter SHALL emit all progress-related events exclusively to the Personal_Room (`student:{studentId}`) and never to a broadcast channel.
2. WHEN a `progress:updated` event is emitted, THE Socket_Emitter SHALL include at minimum: `studentId`, `courseId`, `watchTimeSeconds`, `progress`, and `completedLessonsCount` in the payload.
3. WHEN a `streak:updated` event is emitted, THE Socket_Emitter SHALL include at minimum: `studentId`, `currentStreak`, `longestStreak`, and `lastActivityDate` in the payload.
4. WHEN a `milestone:earned` event is emitted, THE Socket_Emitter SHALL include at minimum: `studentId`, `title`, `description`, `badgeUrl`, and `awardedAt` in the payload.
5. WHEN a `goal:updated` event is emitted, THE Socket_Emitter SHALL include at minimum: `studentId`, `targetHours`, `actualHours`, and `percentage` in the payload.
6. WHEN a `heatmap:updated` event is emitted, THE Socket_Emitter SHALL include at minimum: `studentId`, `date`, and `seconds` in the payload.
7. WHEN `getIO()` returns `null` (Socket.IO not yet initialized), THE Socket_Emitter SHALL log a warning and continue processing without throwing an error or blocking the HTTP response.

---

### Requirement 12: Swagger API Documentation

**User Story:** As a developer integrating with the Learning Hub API, I want complete Swagger/OpenAPI documentation for all endpoints, so that I can understand the request/response contract without reading source code.

#### Acceptance Criteria

1. THE Progress_Controller SHALL include JSDoc Swagger annotations (`@swagger`) for all 11 Learning Hub endpoints covering: HTTP method, path, authentication requirement (`bearerAuth`), request body schema (where applicable), success response schema, and error response schemas for 400, 401, 403, 404, and 500 status codes.
2. WHEN the `GET /api/progress/hub` endpoint is documented, THE Swagger annotation SHALL list all top-level fields returned in the hub response object.
3. THE Swagger documentation SHALL be grouped under the tag `Progress & Analytics` consistent with the existing tag defined in `progress.routes.js`.

---

### Requirement 13: No Mock or Hardcoded Data

**User Story:** As a system operator, I want all Learning Hub metrics to be computed from real database records, so that student-facing data is accurate and trustworthy.

#### Acceptance Criteria

1. THE Learning_Hub_Service SHALL derive all numeric metrics (completion percentages, streak counts, study hours, lesson counts, pacing values) exclusively from MongoDB aggregations or live document reads against the `Enrollment`, `Course`, `User`, `QuizAttempt`, `Assignment`, and `Attendance` collections.
2. THE Learning_Hub_Service SHALL contain no hardcoded arrays, static scores, or placeholder values in any code path that handles a student's real data.
3. WHEN the existing `getAnalyticsReport` function is replaced, THE Progress_Controller SHALL route `GET /api/progress/hub` to the new Learning_Hub_Service method and the old mock-level implementation SHALL be removed.
