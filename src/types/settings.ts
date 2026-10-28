export interface ReminderScheduleSettings {
  60: boolean;
  30: boolean;
  14: boolean;
  7: boolean;
}

export interface NotificationChannelSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface AppSettings {
  schedule: ReminderScheduleSettings;
  channels: NotificationChannelSettings;
}
