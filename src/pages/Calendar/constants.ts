import dayjs from "dayjs";

interface Appointment {
  id: number;
  dateTime: Date;
  treatmentName: string;
  userId?: number;
}

const APPOINTMENTS: Record<string, Appointment[]> = {
  "1": [
    {
      id: 1751364000,
      dateTime: dayjs("2025-07-01T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 1,
    },
    {
      id: 1751371200,
      dateTime: dayjs("2025-07-01T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "2": [
    {
      id: 1751443200,
      dateTime: dayjs("2025-07-02T08:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
    {
      id: 1751461200,
      dateTime: dayjs("2025-07-02T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "3": [
    {
      id: 1751522400,
      dateTime: dayjs("2025-07-03T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1751536800,
      dateTime: dayjs("2025-07-03T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "4": [
    {
      id: 1751623200,
      dateTime: dayjs("2025-07-04T10:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
    {
      id: 1751630400,
      dateTime: dayjs("2025-07-04T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "7": [
    {
      id: 1751871600,
      dateTime: dayjs("2025-07-07T07:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1751886000,
      dateTime: dayjs("2025-07-07T11:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
  ],
  "8": [
    {
      id: 1751968800,
      dateTime: dayjs("2025-07-08T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1751976000,
      dateTime: dayjs("2025-07-08T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "9": [
    {
      id: 1752048000,
      dateTime: dayjs("2025-07-09T08:00:00.000Z").toDate(),
      treatmentName: "facial",
      userId: 100,
    },
    {
      id: 1752066000,
      dateTime: dayjs("2025-07-09T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "10": [
    {
      id: 1752127200,
      dateTime: dayjs("2025-07-10T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
    {
      id: 1752141600,
      dateTime: dayjs("2025-07-10T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "11": [
    {
      id: 1752228000,
      dateTime: dayjs("2025-07-11T10:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1752235200,
      dateTime: dayjs("2025-07-11T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "14": [
    {
      id: 1752476400,
      dateTime: dayjs("2025-07-14T07:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1752490800,
      dateTime: dayjs("2025-07-14T11:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
  ],
  "15": [
    {
      id: 1752573600,
      dateTime: dayjs("2025-07-15T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1752580800,
      dateTime: dayjs("2025-07-15T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "16": [
    {
      id: 1752652800,
      dateTime: dayjs("2025-07-16T08:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
    {
      id: 1752670800,
      dateTime: dayjs("2025-07-16T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "17": [
    {
      id: 1752732000,
      dateTime: dayjs("2025-07-17T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1752746400,
      dateTime: dayjs("2025-07-17T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "18": [
    {
      id: 1752832800,
      dateTime: dayjs("2025-07-18T10:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1752840000,
      dateTime: dayjs("2025-07-18T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "21": [
    {
      id: 1753081200,
      dateTime: dayjs("2025-07-21T07:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
    {
      id: 1753095600,
      dateTime: dayjs("2025-07-21T11:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
  ],
  "22": [
    {
      id: 1753178400,
      dateTime: dayjs("2025-07-22T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1753185600,
      dateTime: dayjs("2025-07-22T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "23": [
    {
      id: 1753257600,
      dateTime: dayjs("2025-07-23T08:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
    {
      id: 1753275600,
      dateTime: dayjs("2025-07-23T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
  ],
  "24": [
    {
      id: 1753336800,
      dateTime: dayjs("2025-07-24T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1753351200,
      dateTime: dayjs("2025-07-24T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "25": [
    {
      id: 1753437600,
      dateTime: dayjs("2025-07-25T10:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1753444800,
      dateTime: dayjs("2025-07-25T12:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
  ],
  "28": [
    {
      id: 1753686000,
      dateTime: dayjs("2025-07-28T07:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
    {
      id: 1753700400,
      dateTime: dayjs("2025-07-28T11:00:00.000Z").toDate(),
      treatmentName: "facial",
      userId: 100,
    },
  ],
  "29": [
    {
      id: 1753783200,
      dateTime: dayjs("2025-07-29T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1753790400,
      dateTime: dayjs("2025-07-29T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "30": [
    {
      id: 1753862400,
      dateTime: dayjs("2025-07-30T08:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
    {
      id: 1753880400,
      dateTime: dayjs("2025-07-30T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
  ],
  "31": [
    {
      id: 1753941600,
      dateTime: dayjs("2025-07-31T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1753956000,
      dateTime: dayjs("2025-07-31T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 1,
    },
  ],
};

export type { Appointment };
export { APPOINTMENTS };
