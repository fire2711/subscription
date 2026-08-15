import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Subscription } from './subs';
import { formatCurrency } from './utils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
  } as any),
});

export const ensurePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: requested } = await Notifications.requestPermissionsAsync();
  return requested === 'granted';
};

export const scheduleForSubscription = async (
  sub: Subscription,
  defaultReminderDays: number,
): Promise<string | null> => {
  if (Platform.OS === 'web') return null;
  if (sub.status !== 'active') return null;

  const window = sub.reminder_days_override ?? defaultReminderDays;
  const renewal = new Date(sub.next_renewal_date);
  // Fire at 9am local on the reminder day.
  const triggerDate = new Date(renewal);
  triggerDate.setDate(triggerDate.getDate() - window);
  triggerDate.setHours(9, 0, 0, 0);

  // Skip past-due schedules.
  if (triggerDate.getTime() <= Date.now()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${sub.name} renews in ${window} day${window === 1 ? '' : 's'}`,
        body: `You'll be charged ${formatCurrency(sub.cost, sub.currency)} — cancel now if you don't need it.`,
        data: { subscriptionId: sub.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      } as any,
    });
    return id;
  } catch (e) {
    console.warn('scheduleForSubscription failed', e);
    return null;
  }
};

export const cancelForSubscription = async (subId: string) => {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(n => (n.content.data as any)?.subscriptionId === subId)
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch (e) {
    console.warn('cancelForSubscription failed', e);
  }
};

export const rescheduleAll = async (subs: Subscription[], defaultDays: number) => {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const sub of subs) {
      await scheduleForSubscription(sub, defaultDays);
    }
  } catch (e) {
    console.warn('rescheduleAll failed', e);
  }
};
