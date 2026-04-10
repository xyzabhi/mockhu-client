export { AppError, type AppErrorKind } from './AppError';
export {
  apiClient,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPostMultipart,
  apiPut,
  type ApiRequestInit,
} from './apiClient';
export {
  getApiBaseUrl,
  getApiV1Url,
  getDevNetworkDelayMs,
  getHealthUrl,
} from './config';
export {
  hydrateSessionUserFromMe,
  refreshSessionProfile,
  type HydrateSessionOptions,
} from './hydrateSessionProfile';
export { getHealth } from './health';
export { normalizeTokenUserProfile } from './normalizeTokenUser';
export { parseApiResponse, isApiEnvelope } from './parseApiResponse';
export { refreshTokens } from './refreshCoordinator';
export { setReauthHandler, notifyReauthRequired } from './reauth';
export {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSessionSnapshot,
  isAccessTokenExpired,
  loadPersistedSession,
  logSessionSnapshot,
  mergeSessionUser,
  saveTokenResponse,
  subscribeSession,
  type SessionSnapshot,
} from './sessionStore';
export type {
  ApiEnvelope,
  ApiErrorBody,
  ApiErrorCode,
  ApiFailureEnvelope,
  ApiSuccessEnvelope,
  TokenResponse,
  TokenUser,
} from './types';

export { authApi } from './auth/authApi';
export type * from './auth/types';
export {
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  EMAIL_ALREADY_REGISTERED_MODAL_BODY,
  isEmailAlreadyRegisteredError,
} from './auth/emailSignupErrors';
export { FORGOT_PASSWORD_PUBLIC_MESSAGE } from './auth/forgotPasswordCopy';

export { userApi } from './user/userApi';
export type {
  AuthorBadge,
  FollowListQuery,
  FollowListResponse,
  FollowResponse,
  LevelInfo,
  MeAvatarUploadResponse,
  MeResponse,
  SetPrivacyResponse,
  UserInterestsResponse,
  UserProfileResponse,
  UserSuggestionsResponse,
  UserSummary,
} from './user/types';
export {
  meAvatarUploadToTokenUserPatch,
  meResponseToTokenUserPatch,
} from './user/meResponseMap';

export { examCatalogApi } from './exam/examCatalogApi';
export type { Exam, ExamCategory, ExamListData, ListExamsParams } from './exam/types';

export { postOnboarding } from './onboarding/onboardingApi';
export type { OnboardingPayload, OnboardingResponseData } from './onboarding/types';

export {
  postApi,
  normalizePost,
  normalizeComment,
  normalizeAuthorBadge,
  mergeStarResponse,
  mergeUnstarResponse,
  mergeBookmarkResponse,
  mergeUnbookmarkResponse,
  mergeCommentStarResponse,
  mergeCommentUnstarResponse,
  getPostComments,
  createPostComment,
  deletePostComment,
  starComment,
  unstarComment,
} from './post/postApi';
export type {
  CreatePostImageInput,
  CreatePostParams,
  GetPostCommentsParams,
} from './post/postApi';
export type {
  CommentAuthor,
  CommentListResponse,
  CommentResponse,
  CommentThread,
  CreateCommentBody,
  DeleteCommentResponse,
} from './post/commentTypes';
export {
  commentAuthorLabel,
  DEFAULT_REPLY_PREVIEW_LIMIT,
  flattenThreads,
} from './post/commentDisplay';
export type { CommentListRow, FlattenThreadsOptions } from './post/commentDisplay';
export type {
  BookmarkPostResponse,
  DeletePostResponse,
  LinkPreviewData,
  PostAuthor,
  PostFeedResponse,
  PostResponse,
  PostType,
  StarResponse,
  UnbookmarkPostResponse,
  UnstarResponse,
} from './post/types';
export { resolvePostMediaUrl } from './post/mediaUrl';
export {
  EXAM_LABELS,
  SUBJECT_LABELS,
  TOPIC_OPTIONS,
  topicBreadcrumb,
  topicBreadcrumbSegments,
  type TopicOption,
} from './post/topicCatalog';
export {
  inferPostImageMimeFromFilename,
  isAllowedPostImageMime,
  parseTagsInput,
  POST_IMAGE_MAX_BYTES,
  POST_MEDIA_MAX_IMAGES,
  POST_TYPES,
  validateMediaRule,
  validatePostBody,
  validatePostContent,
  validatePostHasTitleOrBody,
  validatePostTitle,
} from './post/postValidation';

export { useSession, type UseSessionResult } from './hooks/useSession';
export { useExamCategories, type UseExamCategoriesOptions } from './hooks/useExamCategories';
export { useExamCategoryById } from './hooks/useExamCategoryById';
export { useExamById } from './hooks/useExamById';
export { useExamsList, type UseExamsListOptions } from './hooks/useExamsList';
export { useFollow } from './hooks/useFollow';
export { useUserSuggestions } from './hooks/useUserSuggestions';
export { useInterestSuggestions } from './hooks/useInterestSuggestions';
export { useFollowList, type FollowListKind, type UseFollowListOptions } from './hooks/useFollowList';
export { useFollowCounts } from './hooks/useFollowCounts';
export { useHomeFeed } from './hooks/useHomeFeed';
export { useBookmarkFeed } from './hooks/useBookmarkFeed';
export { useUserPostsFeed } from './hooks/useUserPostsFeed';
export { useUserProfile, isProfileRestricted } from './hooks/useUserProfile';
export { usePostComments } from './hooks/usePostComments';
export { useTopicFeed } from './hooks/useTopicFeed';
export { useLinkPreview } from './hooks/useLinkPreview';
export {
  useUserInterests,
  expandInterestsToExamIds,
  type UseUserInterestsResult,
} from './hooks/useUserInterests';

export { searchApi } from './search/searchApi';
export type {
  GlobalSearchResponse,
  SearchExamCategoryResult,
  SearchExamResult,
  SearchParams,
  SearchPostResult,
  SearchSubjectResult,
  SearchTopicResult,
  SearchType,
  SearchUserResult,
} from './search/types';
export { useGlobalSearch } from './hooks/useGlobalSearch';
