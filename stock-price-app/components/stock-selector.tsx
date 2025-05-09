"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface StockSelectorProps {
  stocks: Record<string, string>
  selectedStock: string | null
  onStockChange: (stock: string) => void
  loading: boolean
}

export default function StockSelector({ stocks, selectedStock, onStockChange, loading }: StockSelectorProps) {
  if (loading) {
    return <Skeleton className="h-10 w-[250px]" />
  }

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="stock-select" className="text-sm font-medium">
        Select Stock
      </label>
      <Select value={selectedStock || ""} onValueChange={onStockChange}>
        <SelectTrigger id="stock-select" className="w-[250px]">
          <SelectValue placeholder="Select a stock" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(stocks).map(([name, ticker]) => (
            <SelectItem key={ticker} value={ticker}>
              {name} ({ticker})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
