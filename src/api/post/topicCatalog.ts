import type { Exam } from '../exam/types';
import type { PostResponse } from './types';

/**
 * Until `GET /topics` exists, keep a single source of truth for `topic_id` + `subject_id`.
 * Replace with API-driven options when your backend exposes lists.
 */
export type TopicOption = {
  topic_id: number;
  subject_id: number;
  label: string;
};

/** Default placeholder — align IDs with your DB `topics` / `subjects` migrations. */
export const TOPIC_OPTIONS: TopicOption[] = [
  { topic_id: 1, subject_id: 1, label: 'General discussion' },
  { topic_id: 2, subject_id: 2, label: 'Maths' },
  { topic_id: 3, subject_id: 2, label: 'Physics' },
];

/** Display names for `subject_id` (extend when your API exposes subjects). */
export const SUBJECT_LABELS: Record<number, string> = {
  1: 'General',
  2: 'IIT JEE',
};

/** Optional exam names by `exams.id` — fill from your catalog or API. */
export const EXAM_LABELS: Record<number, string> = {};

/** Three breadcrumb segments: subject, topic, exam (last is typically emphasized in UI). */
export function topicBreadcrumbSegments(post: PostResponse): [string, string, string] {
  const subject =
    SUBJECT_LABELS[post.subject_id] ?? `Subject ${post.subject_id}`;
  const topicOpt = TOPIC_OPTIONS.find((t) => t.topic_id === post.topic_id);
  const topicLabel = topicOpt?.label ?? `Topic ${post.topic_id}`;
  const examLabel =
    EXAM_LABELS[post.exam_id] ?? `Exam ${post.exam_id}`;
  return [subject, topicLabel, examLabel];
}

/**
 * Breadcrumb: `Subject › Topic › Exam` (narrow separator ` › `).
 * Falls back to id-based labels when a row is missing from the maps above.
 */
export function topicBreadcrumb(post: PostResponse): string {
  return topicBreadcrumbSegments(post).join(' › ');
}

/** Breadcrumb segments while composing (exam may be unselected). */
export function composeBreadcrumbSegments(topic: TopicOption, exam: Exam | null): [string, string, string] {
  const subject = SUBJECT_LABELS[topic.subject_id] ?? `Subject ${topic.subject_id}`;
  const examLabel = exam?.name?.trim() ?? 'Select exam';
  return [subject, topic.label, examLabel];
}
