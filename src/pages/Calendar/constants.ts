import dayjs from "dayjs";

interface Appointment {
  dateTime: Date;
  id: number;
  treatmentName: string;
  userId?: number;
}

const APPOINTMENTS: Record<`${number}`, Appointment[]> = {
  "1": [
    {
      id: 1754042400,
      dateTime: dayjs("2025-08-01T10:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
    {
      id: 1754049600,
      dateTime: dayjs("2025-08-01T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "4": [
    {
      id: 1754290800,
      dateTime: dayjs("2025-08-04T07:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
    {
      id: 1754305200,
      dateTime: dayjs("2025-08-04T11:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
  ],
  "5": [
    {
      id: 1754388000,
      dateTime: dayjs("2025-08-05T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1754395200,
      dateTime: dayjs("2025-08-05T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "6": [
    {
      id: 1754467200,
      dateTime: dayjs("2025-08-06T08:00:00.000Z").toDate(),
      treatmentName: "facial",
      userId: 100,
    },
    {
      id: 1754485200,
      dateTime: dayjs("2025-08-06T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
  ],
  "7": [
    {
      id: 1754546400,
      dateTime: dayjs("2025-08-07T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1754560800,
      dateTime: dayjs("2025-08-07T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "8": [
    {
      id: 1754647200,
      dateTime: dayjs("2025-08-08T10:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
    {
      id: 1754654400,
      dateTime: dayjs("2025-08-08T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "11": [
    {
      id: 1754895600,
      dateTime: dayjs("2025-08-11T07:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1754910000,
      dateTime: dayjs("2025-08-11T11:00:00.000Z").toDate(),
      treatmentName: "facial",
      userId: 100,
    },
  ],
  "12": [
    {
      id: 1754992800,
      dateTime: dayjs("2025-08-12T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
    {
      id: 1755000000,
      dateTime: dayjs("2025-08-12T12:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
  ],
  "13": [
    {
      id: 1755072000,
      dateTime: dayjs("2025-08-13T08:00:00.000Z").toDate(),
      treatmentName: "facial",
      userId: 100,
    },
    {
      id: 1755090000,
      dateTime: dayjs("2025-08-13T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
  ],
  "14": [
    {
      id: 1755151200,
      dateTime: dayjs("2025-08-14T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1755165600,
      dateTime: dayjs("2025-08-14T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
  ],
  "15": [
    {
      id: 1755252000,
      dateTime: dayjs("2025-08-15T10:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1755259200,
      dateTime: dayjs("2025-08-15T12:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
  ],
  "18": [
    {
      id: 1755500400,
      dateTime: dayjs("2025-08-18T07:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1755514800,
      dateTime: dayjs("2025-08-18T11:00:00.000Z").toDate(),
      treatmentName: "facial",
    },
  ],
  "19": [
    {
      id: 1755597600,
      dateTime: dayjs("2025-08-19T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1755604800,
      dateTime: dayjs("2025-08-19T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
  "20": [
    {
      id: 1755676800,
      dateTime: dayjs("2025-08-20T08:00:00.000Z").toDate(),
      treatmentName: "facial",
      userId: 100,
    },
    {
      id: 1755694800,
      dateTime: dayjs("2025-08-20T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "21": [
    {
      id: 1755756000,
      dateTime: dayjs("2025-08-21T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
    {
      id: 1755770400,
      dateTime: dayjs("2025-08-21T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
  ],
  "22": [
    {
      id: 1755856800,
      dateTime: dayjs("2025-08-22T10:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
    {
      id: 1755864000,
      dateTime: dayjs("2025-08-22T12:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
  ],
  "25": [
    {
      id: 1756105200,
      dateTime: dayjs("2025-08-25T07:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
    {
      id: 1756119600,
      dateTime: dayjs("2025-08-25T11:00:00.000Z").toDate(),
      treatmentName: "facial",
      userId: 100,
    },
  ],
  "26": [
    {
      id: 1756202400,
      dateTime: dayjs("2025-08-26T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
    {
      id: 1756209600,
      dateTime: dayjs("2025-08-26T12:00:00.000Z").toDate(),
      treatmentName: "massage",
      userId: 100,
    },
  ],
  "27": [
    {
      id: 1756281600,
      dateTime: dayjs("2025-08-27T08:00:00.000Z").toDate(),
      treatmentName: "facial",
      userId: 100,
    },
    {
      id: 1756299600,
      dateTime: dayjs("2025-08-27T13:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
  ],
  "28": [
    {
      id: 1756360800,
      dateTime: dayjs("2025-08-28T06:00:00.000Z").toDate(),
      treatmentName: "scrub",
      userId: 100,
    },
    {
      id: 1756375200,
      dateTime: dayjs("2025-08-28T10:00:00.000Z").toDate(),
      treatmentName: "scrub",
    },
  ],
  "29": [
    {
      id: 1756461600,
      dateTime: dayjs("2025-08-29T10:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
    {
      id: 1756468800,
      dateTime: dayjs("2025-08-29T12:00:00.000Z").toDate(),
      treatmentName: "massage",
    },
  ],
};

export type { Appointment };
export { APPOINTMENTS };
