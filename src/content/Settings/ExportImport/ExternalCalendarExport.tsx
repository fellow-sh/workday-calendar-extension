import { ISectionData } from "../../App/App.types";
import { formatDateArray, generateICal } from './ExternalCalendarExportHelper';

// Interface for formatting section details into calendar event
export interface Event {
  title: string;
  description: string;
  location?: string; 
  recurrenceRule: string;
  start: number[]; 
  end: number[]; 
  }

// Formats section details into an event and generates download link
export const handleExternalCalendarExport = (sections: ISectionData[]) => {
    
  // Dictionary to store formatted events grouped by worklist
  const formattedEventsByWorklist: { [worklist: number]: Event[] } = {};

  // Loop through all sections
  for(let i = 0; i < sections.length; i++) {

    // Save as constants for code readability later
    const term = sections[i].sectionDetails[0].term;
    const days = sections[i].sectionDetails[0].days;
    const startTime = sections[i].sectionDetails[0].startTime;
    const endTime = sections[i].sectionDetails[0].endTime;
    const worklist = sections[i].worklistNumber;
    const dateRange = sections[i].sectionDetails[0].dateRange;

    // Dictionary of required format
    const dayMap = { Mon: "MO", Tue: "TU", Wed: "WE", Thu: "TH", Fri: "FR" };

    // Map to new format
    const formattedDays = days.map(day => dayMap[day as keyof typeof dayMap]).join(",");

    const dateRangesArray = dateRange.split(" - ");

    const startDate = dateRangesArray[0];
    const endDate = dateRangesArray[dateRangesArray.length - 1]; // Sometimes for multi term classes you have more than two dates
    
    const startDateParts = startDate.split("-");
    const baseYear = parseInt(startDateParts[0]);
    const baseMonth = parseInt(startDateParts[1]);
    let baseDay = parseInt(startDateParts[2]);

    const endDateParts = endDate.split("-");
    let endDateArr = [parseInt(endDateParts[0]), parseInt(endDateParts[1]), parseInt(endDateParts[2]), 23, 59];

    // ------------------------------------------------------------------------------------------ //
    // Need to offset if class has a meeting starting a different day
    // Since winter terms start on Tuesdays, if class meets only on mondays, class starts on week 2
    // Will need to find different solution when summer term support is added
    const offsets = { Mon: 6, Tue: 0, Wed: 1, Thu: 2, Fri: 3 };

    const firstDay = days[0];

    if(firstDay != "Mon"){
      baseDay += offsets[firstDay as keyof typeof offsets];
    } else {
      if (days.length == 1) {
        baseDay += offsets["Mon"];
      } else {
        baseDay += offsets[days[1] as keyof typeof offsets];
      }
    }
    // ------------------------------------------------------------------------------------------ //

    // Split start and endtimes into useable format
    const [startHourString, startMinuteString] = startTime.split(":");

    const startHour = parseInt(startHourString);
    const startMinute = parseInt(startMinuteString);

    const [endHourString, endMinuteString] = endTime.split(":");

    const endHour = parseInt(endHourString);
    const endMinute = parseInt(endMinuteString);

    // Create event
    const event: Event = {
        title: sections[i].code,
        description: sections[i].name,
        location: sections[i].sectionDetails[0].location,
        recurrenceRule: "FREQ=WEEKLY;BYDAY=" + formattedDays + ";INTERVAL=1;UNTIL=" + formatDateArray(endDateArr),
        start: [baseYear, baseMonth, baseDay, startHour, startMinute],
        end: [baseYear, baseMonth, baseDay, endHour, endMinute],
    };

    // Add event to the corresponding worklist group
    if (!formattedEventsByWorklist.hasOwnProperty(worklist)) {
      formattedEventsByWorklist[worklist] = [];
    }
    formattedEventsByWorklist[worklist].push(event);
  }

  // Loop through formatted events grouped by worklist
  for (const worklist in formattedEventsByWorklist) {
    const eventsForWorklist = formattedEventsByWorklist[worklist];

    // Generate ICS string for this worklist's events
    const calendarString = generateICal(eventsForWorklist); 

    console.log(calendarString)

    // Convert string to downloadable blob
    const blob = new Blob([calendarString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `worklist_${worklist}.ics`; // Download filename with worklist number

    link.click();

    URL.revokeObjectURL(url);
  }
};


  
