/**
 * Assessment Summary Screen
 * Redirects to the results screen
 */
import { Redirect } from 'expo-router';

export default function AssessmentSummaryScreen() {
  return <Redirect href={'/assessment/results' as any} />;
}
