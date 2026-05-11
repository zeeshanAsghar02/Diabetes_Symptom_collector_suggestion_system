/**
 * Symptom Assessment Screen
 * Redirects to the full dynamic assessment flow at /assessment.
 * Kept as a route entry for backward compatibility.
 */

import { Redirect } from 'expo-router';

export default function SymptomsScreen() {
  return <Redirect href="/assessment" />;
}


