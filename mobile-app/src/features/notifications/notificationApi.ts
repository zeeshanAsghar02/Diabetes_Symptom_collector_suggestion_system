/**
 * Notification API - RTK Query
 */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { ApiResponse } from '@app-types/api';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery,
  endpoints: (builder) => ({
    scheduleMedicationReminder: builder.mutation<ApiResponse<null>, { userId: string; medicationName: string; time: string }>({
      query: (body) => ({
        url: '/notifications/schedule/medication',
        method: 'POST',
        body,
      }),
    }),
    scheduleAppointmentReminder: builder.mutation<ApiResponse<null>, { userId: string; appointmentDetails: string; time: string }>({
        query: (body) => ({
          url: '/notifications/schedule/appointment',
          method: 'POST',
          body,
        }),
      }),
  }),
});

export const {
    useScheduleMedicationReminderMutation,
    useScheduleAppointmentReminderMutation,
} = notificationApi;
