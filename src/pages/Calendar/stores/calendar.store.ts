import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { createStore } from "zustand-x";

const selectedMonth = dayjs();

const initialState: {
  selectedMonth: Dayjs;
  showOnlyAvailableAppointments: boolean;
} = {
  selectedMonth,
  showOnlyAvailableAppointments: true,
};

const calendarStore = createStore(initialState, {
  devtools: true,
  name: "calendar",
});

export { calendarStore };
