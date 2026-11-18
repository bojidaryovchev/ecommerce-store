const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Sofia",
});

/** Mailbox dates, in the shop's time zone. */
export const formatMailDate = (date: Date | string): string => dateTime.format(new Date(date));

export const formatFileSize = (bytes: number): string =>
  bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1000))} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
