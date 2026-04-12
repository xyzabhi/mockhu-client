# UI prompt: Exam selection, “my exams”, subjects & topics

Copy everything below the line into your React Native / Expo (or web) AI agent or ticket.

---

## Goal

Implement the **exam discovery and syllabus browsing** flow using the Mockhu backend. Users pick exams (onboarding or later), see **My exams**, open an exam, see **subjects**, then **topics per subject**. Use loading/error/empty states and pull-to-refresh where appropriate.

## Environment

- **Base URL:** configurable (e.g. `http://localhost:8080` in dev).
- **API prefix:** `/api/v1`.
- **Auth:** `Authorization: Bearer <access_token>` for protected routes (see below).

## API reference (exam-related)

### Public (no JWT required by server for these paths)

1. **List categories** — `GET /exam-categories`  
   - Optional query: `active=all` to include inactive.
2. **Category detail** — `GET /exam-categories/:category_id`
3. **Exams in category** — `GET /exam-categories/:category_id/exams?limit=&offset=`
4. **List exams** — `GET /exams?limit=&offset=`  
   - Optional: `category_id` or `exam_category_id`.
5. **Exam detail** — `GET /exams/:exam_id`
6. **Subjects for an exam** — `GET /exams/:exam_id/subjects`  
   - Response items include string **`subject_id`** (use in the next call).
7. **All topics for an exam** — `GET /exams/:exam_id/topics`  
   - Large payload if the exam has many topics; prefer per-subject loading when possible.
8. **Topics for one subject within an exam** — `GET /exams/:exam_id/subjects/:subject_id/topics`  
   - `:subject_id` is the **string** from the subjects list (e.g. catalog ids).  
   - **404** if the subject is not linked to that exam.
9. **Search exams** — `GET /search?q=<text>&type=exams&limit=`  
   - **`q` required.** `type=exams` returns only the `exams` section in the standard `{ success, data }` envelope.
10. **Search categories** — `GET /search?q=<text>&type=exam_categories`

### Authenticated (JWT required)

1. **My exams (full exam objects, onboarding order)** — `GET /me/exams`  
   - Returns `{ "exams": [ ExamResponse, ... ] }` inside `data` if your client wraps responses.
2. **Raw interest ids** — `GET /users/:user_id/interests`  
   - Path **`user_id` must match** the logged-in user (UUID).  
   - Returns `exam_category_ids`, `exam_ids`.
3. **Finish onboarding** — `POST /onboarding`  
   - JSON: `first_name`, `last_name`, `exam_ids` (non-empty), `target_year` (1990–2100).

## Suggested UX flow

1. **Onboarding / “Add exams”**  
   - Browse categories → exams, or use **search** (`type=exams`).  
   - Multi-select exams; submit via **`POST /onboarding`** (with names + `target_year`) or a future “update interests” API if you add one.
2. **Home or Profile — “My exams”**  
   - Call **`GET /me/exams`**.  
   - Empty state: prompt user to add exams / complete onboarding.  
   - Show cards with exam name, category if needed (optional extra `GET /exams/:id` if you need fields not in list).
3. **Exam hub**  
   - From **`GET /exams/:exam_id/subjects`**, show a subject list (name, color, weightage).  
   - Tapping a subject: navigate with **`exam_id`** + **`subject_id`**.
4. **Subject topics**  
   - **`GET /exams/:exam_id/subjects/:subject_id/topics`**.  
   - Show topic name, difficulty, importance, order.  
   - Handle **404** (“subject not linked”) with a friendly message.
5. **Deep links / encoding**  
   - If `subject_id` ever contains characters that need encoding in the path, use proper URL encoding.

## Response envelope

Align with your existing app: many endpoints return:

```json
{ "success": true, "data": ... }
```

Parse `data` consistently. Errors: `success: false`, `error.code`, `error.message`.

## Deliverables

- Types/interfaces for exam, subject, topic DTOs matching API JSON.
- Small API module (fetch + auth header injection).
- Screens or tabs: **My exams**, **Exam subjects**, **Subject topics**; optional **Search exams** and **Browse by category**.
- Empty, loading, and error UI; don’t block the whole app on one failed request.

---

_End of prompt._

## Postman

Import **`Mockhu-Exams.postman_collection.json`** (same folder) in Postman. Set collection variables: `baseUrl`, `access_token`, `user_id`, `exam_id`, `category_id`, and `exam_subject_id` from a real `GET /exams/:id/subjects` response.
