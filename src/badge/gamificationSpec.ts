/**
 * Gamification reference — mirrors `internal/badge/xp_table.go` & `hp_table.go` (backend keys).
 * Use for tooltips, education UI, and “why did I earn this?” copy. **Awards are server-side**;
 * this module does not grant XP/HP; it documents product numbers only.
 *
 * Rules: XP is monotonic (no reversals). HP can go up or down; serious penalties are HP-only.
 */

/** Keys for `AwardXPForActionTx` — must match Go `xp_table.go`. */
export type XpActionKey =
  | 'like_post'
  | 'write_comment'
  | 'comment_received_like'
  | 'share_post'
  | 'post_doubt'
  | 'post_tip_win_experience'
  | 'post_received_fire'
  | 'doubt_resolved'
  | 'daily_checkin'
  | 'streak_7_bonus'
  | 'streak_30_bonus'
  | 'topic_studied';

/** Keys for `ApplyHPForActionTx` — must match Go `hp_table.go`. */
export type HpActionKey =
  | 'post_received_fire'
  | 'post_10_fires_milestone'
  | 'post_50_fires_milestone'
  | 'doubt_resolved'
  | 'followed_you'
  | 'moderation_report_confirmed'
  | 'moderation_post_deleted'
  | 'spam_detected';

export type XpRewardRow = {
  key: XpActionKey;
  xp: number;
  /** Short label for UI lists */
  label: string;
  /** Product / anti-abuse notes — not enforced in DB */
  note?: string;
};

export const XP_REWARDS: Record<XpActionKey, XpRewardRow> = {
  like_post: { key: 'like_post', xp: 1, label: 'Like a post' },
  write_comment: {
    key: 'write_comment',
    xp: 2,
    label: 'Write a comment',
    note: 'Cap 20 comments/day (anti-farming — app rule)',
  },
  comment_received_like: {
    key: 'comment_received_like',
    xp: 2,
    label: 'Your comment gets a like',
  },
  share_post: { key: 'share_post', xp: 3, label: 'Share a post' },
  post_doubt: {
    key: 'post_doubt',
    xp: 10,
    label: 'Post a doubt',
    note: 'Optional: one post-type award per day (app rule)',
  },
  post_tip_win_experience: {
    key: 'post_tip_win_experience',
    xp: 15,
    label: 'Post a tip, win, or experience',
  },
  post_received_fire: {
    key: 'post_received_fire',
    xp: 2,
    label: 'Your post gets a fire',
    note: 'Pairs with +1 HP for the same event',
  },
  doubt_resolved: {
    key: 'doubt_resolved',
    xp: 5,
    label: 'Doubt marked resolved',
    note: 'Pairs with +30 HP',
  },
  daily_checkin: {
    key: 'daily_checkin',
    xp: 5,
    label: 'Daily check-in',
    note: 'Once per day',
  },
  streak_7_bonus: { key: 'streak_7_bonus', xp: 50, label: '7-day streak bonus' },
  streak_30_bonus: { key: 'streak_30_bonus', xp: 200, label: '30-day streak bonus' },
  topic_studied: {
    key: 'topic_studied',
    xp: 8,
    label: 'Mark topic as studied',
    note: 'Once per topic',
  },
};

export type HpRewardRow = {
  key: HpActionKey;
  hp: number;
  label: string;
  note?: string;
};

export const HP_REWARDS: Record<HpActionKey, HpRewardRow> = {
  post_received_fire: {
    key: 'post_received_fire',
    hp: 1,
    label: 'Your post gets a fire',
    note: 'Pairs with +2 XP',
  },
  post_10_fires_milestone: {
    key: 'post_10_fires_milestone',
    hp: 15,
    label: 'Post reaches 10 fires',
  },
  post_50_fires_milestone: {
    key: 'post_50_fires_milestone',
    hp: 50,
    label: 'Post reaches 50 fires',
  },
  doubt_resolved: {
    key: 'doubt_resolved',
    hp: 30,
    label: 'Doubt marked resolved',
    note: 'Pairs with +5 XP',
  },
  followed_you: { key: 'followed_you', hp: 5, label: 'Someone follows you' },
  moderation_report_confirmed: {
    key: 'moderation_report_confirmed',
    hp: -30,
    label: 'Report confirmed',
    note: 'XP not clawed back',
  },
  moderation_post_deleted: {
    key: 'moderation_post_deleted',
    hp: -50,
    label: 'Post deleted by moderator',
  },
  spam_detected: {
    key: 'spam_detected',
    hp: -100,
    label: 'Spam detected',
    note: 'Maximum HP penalty',
  },
};

/**
 * XP reward sizes, largest → smallest — for bar charts / “what pays most?” education.
 * (Distinct amounts only; multiple actions can share the same XP.)
 */
export const XP_REWARD_LADDER_DESC = [200, 50, 15, 10, 8, 5, 3, 2, 1] as const;

/** Line items for the “typical active day” example (product doc). Totals: +54 XP, +25 HP when summed. */
export const TYPICAL_DAY_EXAMPLE = {
  xpTotal: 54,
  hpTotal: 25,
  lines: [
    { label: 'Post 1 TIP', xp: 15 },
    { label: 'Like 5 posts', xp: 5 },
    { label: '3 comments', xp: 6 },
    { label: '1 share', xp: 3 },
    { label: '10 fires received', xp: 20, hp: 10 },
    { label: 'Milestone 10 fires', hp: 15 },
    { label: 'Daily check-in', xp: 5 },
  ] as const,
} as const;

/** Lookup XP amount by action key (0 if unknown — should not happen for `XpActionKey`). */
export function xpAmountForAction(key: XpActionKey): number {
  return XP_REWARDS[key]?.xp ?? 0;
}

/** Lookup HP delta by action key. */
export function hpDeltaForAction(key: HpActionKey): number {
  return HP_REWARDS[key]?.hp ?? 0;
}
