// src/components/SessionCalendar.js
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const SessionCalendar = ({ sessions }) => {
  const events = sessions.map((s) => ({
    id: s._id,
    title: `${s.patientId?.name || "Patient"} - ${s.therapistId?.name || "Therapist"}`,
    start: s.startTime,
    end: s.endTime,
  }));

  return (
    <div className="bg-white p-3 rounded shadow-sm mb-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="auto"
      />
    </div>
  );
};

export default SessionCalendar;
