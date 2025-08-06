import dayjs from "dayjs";
import type { JSX } from "react";

import type { Appointment as AppointmentType } from "@client/pages/Calendar/constants";

import styles from "./Appointment.module.scss";

const Appointment = ({
  dateTime,
  treatmentName,
}: AppointmentType): JSX.Element => {
  const appointmentHour = dayjs(dateTime).format("h a");

  return (
    <div className={styles["appointment"]}>
      <div className={styles["details"]}>
        <span className={styles["hour"]}>{appointmentHour}</span>
        <span className={styles["treatment-name"]}>{treatmentName}</span>
      </div>
    </div>
  );
};

export { Appointment };
