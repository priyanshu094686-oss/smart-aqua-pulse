import { Button } from "@/components/ui/button";

interface TimeRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

const TimeRangeSelector = ({ selectedRange, onRangeChange }: TimeRangeSelectorProps) => {
  const ranges = [
    { value: 'live', label: 'Live' },
    { value: '1h', label: '1h' },
    { value: '6h', label: '6h' },
    { value: '1d', label: '1d' },
    { value: '1w', label: '1w' },
    { value: '1m', label: '1m' },
    { value: '3m', label: '3m' }
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={selectedRange === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onRangeChange(range.value)}
          className="min-w-[60px]"
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
