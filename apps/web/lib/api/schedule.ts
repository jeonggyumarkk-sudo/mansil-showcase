import { client } from './client';

export type ScheduleEvent = {
    id: string;
    title: string;
    start: string;
    allDay: boolean;
    color?: string;
    extendedProps?: Record<string, string>;
};

export async function fetchScheduleEvents(): Promise<ScheduleEvent[]> {
    const res = await client.get<ScheduleEvent[]>('/schedule');
    return res.data;
}
