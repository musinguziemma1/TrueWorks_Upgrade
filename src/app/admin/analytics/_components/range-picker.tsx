import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const PRESETS = ["Today", "This Week", "This Month", "This Quarter", "This Year", "All Time", "Custom"] as const;
export type DateRange = (typeof PRESETS)[number];

export function RangePicker({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value} onValueChange={(v) => v && onChange(v as DateRange)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === "Custom" && (
        <>
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="w-[150px] h-9"
            aria-label="From date"
          />
          <span className="text-xs text-muted-foreground">&rarr;</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="w-[150px] h-9"
            aria-label="To date"
          />
        </>
      )}
    </div>
  );
}
