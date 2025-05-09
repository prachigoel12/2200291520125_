"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StockChart from "@/components/stock-chart"
import CorrelationHeatmap from "@/components/correlation-heatmap"
import StockSelector from "@/components/stock-selector"
import TimeIntervalSelector from "@/components/time-interval-selector"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function StockDashboard() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [timeInterval, setTimeInterval] = useState<number>(30) // Default 30 minutes
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [stocks, setStocks] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true)

        // Use our API route instead of the external API directly
        const response = await fetch("/api/stocks")

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()
        console.log("API Response:", data)

        // Check if the response has the expected structure
        if (data && data.stocks && typeof data.stocks === "object") {
          setStocks(data.stocks)

          // Set the first stock as selected by default
          if (Object.values(data.stocks).length > 0) {
            setSelectedStock(Object.values(data.stocks)[0])
          }
        } else {
          console.error("Unexpected API response structure:", data)
          throw new Error("Unexpected API response structure")
        }
      } catch (err) {
        console.error("Error in fetchStocks:", err)
        setError("Failed to fetch stocks. Using sample data instead.")

        // Set fallback data even if the outer try-catch fails
        const fallbackStocks = {
          "Apple Inc.": "AAPL",
          "Microsoft Corporation": "MSFT",
          "Amazon.com, Inc.": "AMZN",
          "Alphabet Inc. Class A": "GOOGL",
          "Meta Platforms, Inc.": "META",
        }

        setStocks(fallbackStocks)
        if (Object.values(fallbackStocks).length > 0) {
          setSelectedStock(Object.values(fallbackStocks)[0])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStocks()
  }, [])

  const handleStockChange = (stock: string) => {
    setSelectedStock(stock)
  }

  const handleTimeIntervalChange = (interval: number) => {
    setTimeInterval(interval)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <StockSelector
          stocks={stocks}
          selectedStock={selectedStock}
          onStockChange={handleStockChange}
          loading={loading}
        />
        <TimeIntervalSelector timeInterval={timeInterval} onTimeIntervalChange={handleTimeIntervalChange} />
      </div>

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chart">Stock Price Chart</TabsTrigger>
          <TabsTrigger value="heatmap">Correlation Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Stock Price Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStock ? (
                <StockChart ticker={selectedStock} timeInterval={timeInterval} />
              ) : (
                <div className="flex justify-center items-center h-[400px]">
                  <p>Select a stock to view its price chart</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Stock Correlation Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <CorrelationHeatmap timeInterval={timeInterval} stocks={stocks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
