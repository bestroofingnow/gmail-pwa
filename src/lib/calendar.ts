import { google } from "googleapis";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  status?: string;
  htmlLink?: string;
  conferenceData?: {
    conferenceId?: string;
    entryPoints?: {
      entryPointType: string;
      uri: string;
    }[];
  };
  recurrence?: string[];
  recurringEventId?: string;
}

export interface CalendarList {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function listCalendars(accessToken: string): Promise<CalendarList[]> {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.calendarList.list();

  return (response.data.items || []).map((cal) => ({
    id: cal.id || "",
    summary: cal.summary || "",
    description: cal.description ?? undefined,
    primary: cal.primary ?? false,
    backgroundColor: cal.backgroundColor ?? undefined,
    foregroundColor: cal.foregroundColor ?? undefined,
    accessRole: cal.accessRole ?? undefined,
  }));
}

export async function getEvents(
  accessToken: string,
  calendarId: string = "primary",
  options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: "startTime" | "updated";
  } = {}
): Promise<{ events: CalendarEvent[]; nextPageToken?: string }> {
  const calendar = getCalendarClient(accessToken);

  const defaultTimeMin = new Date();
  defaultTimeMin.setHours(0, 0, 0, 0);

  const response = await calendar.events.list({
    calendarId,
    timeMin: options.timeMin || defaultTimeMin.toISOString(),
    timeMax: options.timeMax,
    maxResults: options.maxResults || 50,
    singleEvents: options.singleEvents !== false,
    orderBy: options.orderBy || "startTime",
  });

  const events = (response.data.items || []).map((event) => ({
    id: event.id || "",
    summary: event.summary || "",
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: {
      dateTime: event.start?.dateTime ?? undefined,
      date: event.start?.date ?? undefined,
      timeZone: event.start?.timeZone ?? undefined,
    },
    end: {
      dateTime: event.end?.dateTime ?? undefined,
      date: event.end?.date ?? undefined,
      timeZone: event.end?.timeZone ?? undefined,
    },
    attendees: event.attendees?.map((a) => ({
      email: a.email || "",
      displayName: a.displayName ?? undefined,
      responseStatus: a.responseStatus ?? undefined,
    })),
    status: event.status ?? undefined,
    htmlLink: event.htmlLink ?? undefined,
    conferenceData: event.conferenceData
      ? {
          conferenceId: event.conferenceData.conferenceId ?? undefined,
          entryPoints: event.conferenceData.entryPoints?.map((e) => ({
            entryPointType: e.entryPointType || "",
            uri: e.uri || "",
          })),
        }
      : undefined,
    recurrence: event.recurrence ?? undefined,
    recurringEventId: event.recurringEventId ?? undefined,
  }));

  return {
    events,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

export async function getEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = "primary"
): Promise<CalendarEvent> {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.events.get({
    calendarId,
    eventId,
  });

  const event = response.data;
  return {
    id: event.id || "",
    summary: event.summary || "",
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: {
      dateTime: event.start?.dateTime ?? undefined,
      date: event.start?.date ?? undefined,
      timeZone: event.start?.timeZone ?? undefined,
    },
    end: {
      dateTime: event.end?.dateTime ?? undefined,
      date: event.end?.date ?? undefined,
      timeZone: event.end?.timeZone ?? undefined,
    },
    attendees: event.attendees?.map((a) => ({
      email: a.email || "",
      displayName: a.displayName ?? undefined,
      responseStatus: a.responseStatus ?? undefined,
    })),
    status: event.status ?? undefined,
    htmlLink: event.htmlLink ?? undefined,
    conferenceData: event.conferenceData
      ? {
          conferenceId: event.conferenceData.conferenceId ?? undefined,
          entryPoints: event.conferenceData.entryPoints?.map((e) => ({
            entryPointType: e.entryPointType || "",
            uri: e.uri || "",
          })),
        }
      : undefined,
    recurrence: event.recurrence ?? undefined,
    recurringEventId: event.recurringEventId ?? undefined,
  };
}

export async function createEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: { email: string }[];
    recurrence?: string[];
    conferenceDataVersion?: number;
  },
  calendarId: string = "primary"
): Promise<CalendarEvent> {
  const calendar = getCalendarClient(accessToken);

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: event.conferenceDataVersion || 0,
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      attendees: event.attendees,
      recurrence: event.recurrence,
    },
  });

  const created = response.data;
  return {
    id: created.id || "",
    summary: created.summary || "",
    description: created.description ?? undefined,
    location: created.location ?? undefined,
    start: {
      dateTime: created.start?.dateTime ?? undefined,
      date: created.start?.date ?? undefined,
      timeZone: created.start?.timeZone ?? undefined,
    },
    end: {
      dateTime: created.end?.dateTime ?? undefined,
      date: created.end?.date ?? undefined,
      timeZone: created.end?.timeZone ?? undefined,
    },
    attendees: created.attendees?.map((a) => ({
      email: a.email || "",
      displayName: a.displayName ?? undefined,
      responseStatus: a.responseStatus ?? undefined,
    })),
    status: created.status ?? undefined,
    htmlLink: created.htmlLink ?? undefined,
  };
}

export async function updateEvent(
  accessToken: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    start?: { dateTime?: string; date?: string; timeZone?: string };
    end?: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: { email: string }[];
  },
  calendarId: string = "primary"
): Promise<CalendarEvent> {
  const calendar = getCalendarClient(accessToken);

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: updates,
  });

  const updated = response.data;
  return {
    id: updated.id || "",
    summary: updated.summary || "",
    description: updated.description ?? undefined,
    location: updated.location ?? undefined,
    start: {
      dateTime: updated.start?.dateTime ?? undefined,
      date: updated.start?.date ?? undefined,
      timeZone: updated.start?.timeZone ?? undefined,
    },
    end: {
      dateTime: updated.end?.dateTime ?? undefined,
      date: updated.end?.date ?? undefined,
      timeZone: updated.end?.timeZone ?? undefined,
    },
    attendees: updated.attendees?.map((a) => ({
      email: a.email || "",
      displayName: a.displayName ?? undefined,
      responseStatus: a.responseStatus ?? undefined,
    })),
    status: updated.status ?? undefined,
    htmlLink: updated.htmlLink ?? undefined,
  };
}

export async function deleteEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = "primary"
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

export async function findFreeSlots(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarIds: string[] = ["primary"],
  durationMinutes: number = 30
): Promise<{ start: string; end: string }[]> {
  const calendar = getCalendarClient(accessToken);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: calendarIds.map((id) => ({ id })),
    },
  });

  const busySlots: { start: Date; end: Date }[] = [];
  for (const calendarId of calendarIds) {
    const busy = response.data.calendars?.[calendarId]?.busy || [];
    for (const slot of busy) {
      if (slot.start && slot.end) {
        busySlots.push({
          start: new Date(slot.start),
          end: new Date(slot.end),
        });
      }
    }
  }

  // Sort busy slots by start time
  busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find free slots
  const freeSlots: { start: string; end: string }[] = [];
  let currentTime = new Date(timeMin);
  const endTime = new Date(timeMax);
  const durationMs = durationMinutes * 60 * 1000;

  for (const busy of busySlots) {
    if (busy.start.getTime() - currentTime.getTime() >= durationMs) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: busy.start.toISOString(),
      });
    }
    if (busy.end > currentTime) {
      currentTime = busy.end;
    }
  }

  if (endTime.getTime() - currentTime.getTime() >= durationMs) {
    freeSlots.push({
      start: currentTime.toISOString(),
      end: endTime.toISOString(),
    });
  }

  return freeSlots;
}
