import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export function getDueDailySummaryDate(now = dayjs()) {
	const localNow = now.tz("America/Sao_Paulo");
	return localNow.hour() >= 21 ? localNow.format("YYYY-MM-DD") : null;
}
