// Local medication reminder notifications.
// CR-MED-03 / CR-MED-12: reminders scheduled offline, survive reboot.
// Notification IDs are deterministic: `dose-{scheduleId}-{date}-{time}`
// so rescheduling is idempotent.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medications', {
      name: 'Medication reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }
  return true;
}

export interface ScheduleParams {
  scheduleId: string;
  medicationName: string;
  time: string;       // "HH:MM"
  daysOfWeek: number[]; // 0=Sun … 6=Sat
}

// Schedules a repeating weekly notification for each day+time in the schedule.
// Safe to call multiple times — cancels then recreates.
export async function scheduleMedicationReminder(params: ScheduleParams): Promise<void> {
  await cancelMedicationReminder(params.scheduleId);

  for (const day of params.daysOfWeek) {
    const [hour, minute] = params.time.split(':').map(Number);
    const notifId = `dose-${params.scheduleId}-d${day}-t${params.time.replace(':', '')}`;

    await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: 'Time for your medication',
        body: `${params.time} — ${params.medicationName}`,
        data: { scheduleId: params.scheduleId, time: params.time },
        sound: 'default',
        categoryIdentifier: 'MEDICATION',
      },
      trigger: {
        weekday: day + 1, // expo-notifications uses 1=Sun … 7=Sat
        hour,
        minute,
        repeats: true,
        channelId: 'medications',
      } as Notifications.WeeklyTriggerInput,
    });
  }
}

// Cancels all notifications for a given schedule.
export async function cancelMedicationReminder(scheduleId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.identifier.startsWith(`dose-${scheduleId}-`));
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

// Cancels a single dose slot notification (called after the patient taps Taken).
export async function cancelDoseNotification(scheduleId: string, time: string, day: number): Promise<void> {
  const notifId = `dose-${scheduleId}-d${day}-t${time.replace(':', '')}`;
  await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
}

// Call on app boot or after any schedule sync to bring notifications up to date.
export async function syncNotificationsFromSchedules(
  schedules: Array<{
    id: string;
    medicationName: string;
    times: string[];
    days_of_week: number[];
    active: boolean;
  }>,
): Promise<void> {
  const permitted = await requestNotificationPermission();
  if (!permitted) return;

  // Cancel all existing medication notifications, then rebuild.
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith('dose-'))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  for (const s of schedules) {
    if (!s.active) continue;
    for (const time of s.times) {
      await scheduleMedicationReminder({
        scheduleId: s.id,
        medicationName: s.medicationName,
        time,
        daysOfWeek: s.days_of_week,
      });
    }
  }
}

// Register interactive notification categories (Taken / Snooze actions).
export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('MEDICATION', [
    {
      identifier: 'TAKEN',
      buttonTitle: 'Taken',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Snooze 15 min',
      options: { opensAppToForeground: false },
    },
  ]);
}
