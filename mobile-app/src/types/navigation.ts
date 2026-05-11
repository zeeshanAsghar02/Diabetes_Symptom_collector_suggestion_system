/**
 * Navigation Types
 * Type-safe routing with Expo Router
 */

export type RootStackParamList = {
  index: undefined;
  '(auth)/signin': undefined;
  '(auth)/signup': undefined;
  '(auth)/forgot-password': undefined;
  '(auth)/reset-password/[token]': { token: string };
  '(auth)/activate/[token]': { token: string };
  '(onboarding)/welcome': undefined;
  '(onboarding)/diagnosis': undefined;
  '(onboarding)/symptoms': undefined;
  '(tabs)/dashboard': undefined;
  '(tabs)/plans': undefined;
  '(tabs)/chat': undefined;
  '(tabs)/profile': undefined;
  'assessment/index': undefined;
  'personalized/medical-info': undefined;
  'personalized/diet-plan/index': undefined;
  'personalized/monthly-diet/index': undefined;
  'personalized/exercise-plan/index': undefined;
  'personalized/lifestyle-tips/index': undefined;
  'personalized/lifestyle-tips/[id]': { id: string };
  'personalized/habits/index': undefined;
  'profile/change-password': undefined;
  'profile/edit-disease-data': undefined;
  'feedback/index': undefined;
  'articles/index': undefined;
  'articles/[slug]': { slug: string };
};

export type TabParamList = {
  dashboard: undefined;
  plans: undefined;
  chat: undefined;
  profile: undefined;
};

// Navigation hooks type inference
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
