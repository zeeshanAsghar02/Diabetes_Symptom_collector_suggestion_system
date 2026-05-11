/**
 * Assessment Question Screen
 * Redirects to the main assessment flow at /assessment
 */
import { Redirect } from 'expo-router';

export default function QuestionScreen() {
  return <Redirect href="/assessment" />;
}
