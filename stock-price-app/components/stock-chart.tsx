"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface StockPrice {
  price: number
  lastUpdatedAt: string
}

interface StockChartProps {
  ticker: string
  timeInterval: number
}

export default function StockChart({ ticker, timeInterval }: StockChartProps) {
  const [priceData, setPriceData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [average, setAverage] = useState<number | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null)

  useEffect(() => {
    const fetchStockPrices = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use our API route instead of the external API directly
        const response = await fetch(`/api/stocks/${ticker}?minutes=${timeInterval}`)

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()
        console.log(`Stock price data for ${ticker}:`, data)

        let priceDataResponse = []

        // Check if the response is an array (for minutes parameter) or a single object
        if (Array.isArray(data)) {
          priceDataResponse = data
        } else if (data && data.stock && data.stock.price) {
          // Handle single price response
          priceDataResponse = [
            {
              price: data.stock.price,
              lastUpdatedAt: data.stock.lastUpdatedAt,
            },
          ]
        } else {
          console.error("Unexpected API response structure:", data)
          throw new Error("Unexpected API response structure")
        }

        // Format data for the chart
        const formattedData = priceDataResponse.map((item) => ({
          price: item.price,
          time: new Date(item.lastUpdatedAt).toLocaleTimeString(),
          date: new Date(item.lastUpdatedAt).toLocaleDateString(),
          timestamp: new Date(item.lastUpdatedAt).getTime(),
        }))

        // Sort by timestamp
        formattedData.sort((a, b) => a.timestamp - b.timestamp)

        setPriceData(formattedData)

        // Calculate average
        if (formattedData.length > 0) {
          const avg = formattedData.reduce((sum, item) => sum + item.price, 0) / formattedData.length
          setAverage(Number.parseFloat(avg.toFixed(2)))
        } else {
          setAverage(null)
        }
      } catch (err) {
        console.error("Error in fetchStockPrices:", err)
        setError("Failed to fetch stock prices. Using sample data instead.")

        // Generate mock data as a fallback
        const now = new Date()
        const mockData = Array.from({ length: 10 }, (_, i) => ({
          price: 100 + Math.random() * 50,
          time: new Date(now.getTime() - i * 5 * 60000).toLocaleTimeString(),
          date: new Date(now.getTime() - i * 5 * 60000).toLocaleDateString(),
          timestamp: now.getTime() - i * 5 * 60000,
        }))

        setPriceData(mockData)
        const avg = mockData.reduce((sum, item) => sum + item.price, 0) / mockData.length
        setAverage(Number.parseFloat(avg.toFixed(2)))
      } finally {
        setLoading(false)
      }
    }

    if (ticker) {
      fetchStockPrices()
    }
  }, [ticker, timeInterval])

  const handleMouseOver = (data: any) => {
    if (data && data.activePayload) {
      setSelectedPoint(data.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setSelectedPoint(null)
  }

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (priceData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p>No price data available for the selected time interval</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedPoint && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{selectedPoint.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{selectedPoint.time}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">${selectedPoint.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Difference from Avg</p>
                <p
                  className={`font-medium ${selectedPoint.price > (average || 0) ? "text-green-500" : "text-red-500"}`}
                >
                  {average ? (selectedPoint.price - average).toFixed(2) : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={priceData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseMove={handleMouseOver}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" label={{ value: "Time", position: "insideBottomRight", offset: -10 }} />
            <YAxis label={{ value: "Price ($)", angle: -90, position: "insideLeft" }} domain={["auto", "auto"]} />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend />
            <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} name="Stock Price" />
            {average !== null && (
              <ReferenceLine
                y={average}
                stroke="red"
                strokeDasharray="3 3"
                label={{ value: `Avg: $${average}`, position: "right" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {average !== null && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <p className="font-medium">Average Price: ${average}</p>
          <p className="text-sm text-muted-foreground">
            Based on {priceData.length} data points over the last {timeInterval} minutes
          </p>
        </div>
      )}
    </div>
  )
}
