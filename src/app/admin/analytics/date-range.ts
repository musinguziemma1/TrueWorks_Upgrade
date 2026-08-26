export function getDateRangeFilter(range: string) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  let startDate = "";
  let startTimestamp = 0;

  switch (range) {
    case "Today":
      startDate = today;
      startTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      break;
    case "This Week": {
      const day = now.getDay();
      const diff = now.getDate() - day;
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
      startDate = weekStart.toISOString().slice(0, 10);
      startTimestamp = weekStart.getTime();
      break;
    }
    case "This Month":
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      startTimestamp = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      break;
    case "This Quarter": {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = `${now.getFullYear()}-${String(qStart + 1).padStart(2, "0")}-01`;
      startTimestamp = new Date(now.getFullYear(), qStart, 1).getTime();
      break;
    }
    case "This Year":
      startDate = `${now.getFullYear()}-01-01`;
      startTimestamp = new Date(now.getFullYear(), 0, 1).getTime();
      break;
    default:
      startDate = "";
      startTimestamp = 0;
  }

  return { startDate, endDate: today, startTimestamp, endTimestamp: now.getTime() };
}

export function pctDelta(current: number, previous: number): number | undefined {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getPreviousRange(range: string, current: ReturnType<typeof getDateRangeFilter>) {
  const start = new Date(current.startTimestamp);
  const end = new Date(current.endTimestamp);
  const duration = end.getTime() - start.getTime();
  const prevEndTs = start.getTime() - 1;
  const prevStartTs = prevEndTs - duration;
  const iso = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  if (range === "All Time" || current.startTimestamp === 0) {
    return { startDate: "", endDate: current.endDate };
  }
  return { startDate: iso(prevStartTs), endDate: iso(prevEndTs) };
}
