import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';

type Appointment = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  type: 'MEETING' | 'ACTIVITY' | 'CONSULTATION';
  hostId: string;
  hostName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
};

type CalendarProps = {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
};

const Calendar: React.FC<CalendarProps> = ({ appointments, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    // Bereken alle dagen van de huidige maand
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    setCalendarDays(daysInMonth);
  }, [currentMonth]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Controleer of een datum afspraken heeft
  const hasAppointments = (date: Date) => {
    return appointments.some(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return isSameDay(date, appointmentDate);
    });
  };

  // Haal afspraken op voor een specifieke datum
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return isSameDay(date, appointmentDate);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy', { locale: nl })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            &lt;
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Voeg lege cellen toe voor dagen vóór de eerste dag van de maand */}
        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() || 7 }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-12 p-1" />
        ))}

        {calendarDays.map(day => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const hasEvents = hasAppointments(day);
          
          return (
            <div
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={`h-12 p-1 border rounded cursor-pointer transition-colors ${
                isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
              } ${isSelected ? 'bg-blue-100 border-blue-500' : ''} ${
                hasEvents ? 'font-bold' : ''
              } hover:bg-gray-100`}
            >
              <div className="flex flex-col h-full">
                <span className="text-sm">{format(day, 'd')}</span>
                {hasEvents && (
                  <div className="mt-auto">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium text-gray-800">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
          </h3>
          <div className="mt-2">
            {getAppointmentsForDate(selectedDate).length > 0 ? (
              <ul className="space-y-2">
                {getAppointmentsForDate(selectedDate).map(appointment => (
                  <li key={appointment.id} className="p-2 bg-gray-50 rounded border">
                    <div className="font-medium">{appointment.title}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(appointment.startTime), 'HH:mm')} - 
                      {format(new Date(appointment.endTime), 'HH:mm')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.hostName}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Geen afspraken voor deze dag</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
