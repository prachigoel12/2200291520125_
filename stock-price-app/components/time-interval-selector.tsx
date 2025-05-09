"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimeIntervalSelectorProps {
  timeInterval: number
  onTimeIntervalChange: (interval: number) => void
}

export default function TimeIntervalSelector({ timeInterval, onTimeIntervalChange }: TimeIntervalSelectorProps) {
  const intervals = [
    { value: 15, label: "Last 15 minutes" },
    { value: 30, label: "Last 30 minutes" },
    { value: 60, label: "Last 1 hour" },
    { value: 120, label: "Last 2 hours" },
    { value: 240, label: "Last 4 hours" },
  ]

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="time-interval-select" className="text-sm font-medium">
        Time Interval
      </label>
      <Select value={timeInterval.toString()} onValueChange={(value) => onTimeIntervalChange(Number.parseInt(value))}>
        <SelectTrigger id="time-interval-select" className="w-[200px]">
          <SelectValue placeholder="Select time interval" />
        </SelectTrigger>
        <SelectContent>
          {intervals.map((interval) => (
            <SelectItem key={interval.value} value={interval.value.toString()}>
              {interval.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
