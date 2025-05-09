"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StockPrice {
  price: number
  lastUpdatedAt: string
}

interface StockData {
  ticker: string
  name: string
  prices: StockPrice[]
  average: number
  stdDev: number
}

interface CorrelationHeatmapProps {
  timeInterval: number
  stocks: Record<string, string>
}

export default function CorrelationHeatmap({ timeInterval, stocks }: CorrelationHeatmapProps) {
  const [stocksData, setStocksData] = useState<StockData[]>([])
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredStock, setHoveredStock] = useState<StockData | null>(null)

  useEffect(() => {
    const fetchAllStockData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Limit to 10 stocks for performance
        const stockEntries = Object.entries(stocks).slice(0, 10)
        const allStocksData = []

        // Fetch data for each stock
        for (const [name, ticker] of stockEntries) {
          try {
            // Use our API route instead of the external API directly
            const response = await fetch(`/api/stocks/${ticker}?minutes=${timeInterval}`)

            if (!response.ok) {
              throw new Error(`Failed to fetch data for ${ticker}`)
            }

            let priceData = []
            const data = await response.json()

            // Check if the response is an array (for minutes parameter) or a single object
            if (Array.isArray(data)) {
              priceData = data
            } else if (data && data.stock && data.stock.price) {
              // Handle single price response
              priceData = [
                {
                  price: data.stock.price,
                  lastUpdatedAt: data.stock.lastUpdatedAt,
                },
              ]
            } else {
              console.error(`Unexpected API response structure for ${ticker}:`, data)
              throw new Error("Unexpected API response structure")
            }

            // Calculate average
            const prices = priceData.map((item) => item.price)

            if (prices.length > 0) {
              const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length

              // Calculate standard deviation
              const squaredDiffs = prices.map((price) => Math.pow(price - avg, 2))
              const variance =
                squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (prices.length > 1 ? prices.length - 1 : 1) // Avoid division by zero
              const stdDev = Math.sqrt(variance)

              allStocksData.push({
                ticker,
                name,
                prices: priceData,
                average: Number.parseFloat(avg.toFixed(2)),
                stdDev: Number.parseFloat(stdDev.toFixed(2)),
              })
            }
          } catch (stockError) {
            console.error(`Error fetching data for ${ticker}:`, stockError)

            // Generate mock data for this stock
            const now = new Date()
            const mockPrices = Array.from({ length: 10 }, (_, i) => ({
              price: 100 + Math.random() * 50,
              lastUpdatedAt: new Date(now.getTime() - i * 5 * 60000).toISOString(),
            }))

            const prices = mockPrices.map((item) => item.price)
            const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length
            const squaredDiffs = prices.map((price) => Math.pow(price - avg, 2))
            const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (prices.length - 1)
            const stdDev = Math.sqrt(variance)

            allStocksData.push({
              ticker,
              name,
              prices: mockPrices,
              average: Number.parseFloat(avg.toFixed(2)),
              stdDev: Number.parseFloat(stdDev.toFixed(2)),
            })
          }
        }

        setStocksData(allStocksData)

        // Calculate correlation matrix
        const matrix = calculateCorrelationMatrix(allStocksData)
        setCorrelationMatrix(matrix)
      } catch (err) {
        console.error("Failed to fetch stock data:", err)
        setError("Failed to fetch stock data. Using sample data instead.")

        // Generate mock data for all stocks
        const stockEntries = Object.entries(stocks).slice(0, 10)
        const mockStocksData = stockEntries.map(([name, ticker]) => {
          const now = new Date()
          const mockPrices = Array.from({ length: 10 }, (_, i) => ({
            price: 100 + Math.random() * 50,
            lastUpdatedAt: new Date(now.getTime() - i * 5 * 60000).toISOString(),
          }))

          const prices = mockPrices.map((item) => item.price)
          const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length
          const squaredDiffs = prices.map((price) => Math.pow(price - avg, 2))
          const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (prices.length - 1)
          const stdDev = Math.sqrt(variance)

          return {
            ticker,
            name,
            prices: mockPrices,
            average: Number.parseFloat(avg.toFixed(2)),
            stdDev: Number.parseFloat(stdDev.toFixed(2)),
          }
        })

        setStocksData(mockStocksData)
        const matrix = calculateCorrelationMatrix(mockStocksData)
        setCorrelationMatrix(matrix)
      } finally {
        setLoading(false)
      }
    }

    if (Object.keys(stocks).length > 0) {
      fetchAllStockData()
    }
  }, [stocks, timeInterval])

  const calculateCorrelationMatrix = (stocksData: StockData[]): number[][] => {
    const n = stocksData.length
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1 // Perfect correlation with self
        } else {
          matrix[i][j] = calculateCorrelation(stocksData[i], stocksData[j])
        }
      }
    }

    return matrix
  }

  const calculateCorrelation = (stockA: StockData, stockB: StockData): number => {
    // Create a map of timestamps to prices for both stocks
    const stockAMap = new Map(stockA.prices.map((item) => [new Date(item.lastUpdatedAt).getTime(), item.price]))

    const stockBMap = new Map(stockB.prices.map((item) => [new Date(item.lastUpdatedAt).getTime(), item.price]))

    // Find common timestamps
    const commonTimestamps = [...stockAMap.keys()].filter((timestamp) => stockBMap.has(timestamp))

    if (commonTimestamps.length < 2) {
      return 0 // Not enough data points for correlation
    }

    // Extract paired values
    const pairsA = commonTimestamps.map((timestamp) => stockAMap.get(timestamp) as number)
    const pairsB = commonTimestamps.map((timestamp) => stockBMap.get(timestamp) as number)

    // Calculate means
    const meanA = pairsA.reduce((sum, val) => sum + val, 0) / pairsA.length
    const meanB = pairsB.reduce((sum, val) => sum + val, 0) / pairsB.length

    // Calculate covariance and standard deviations
    let covariance = 0
    let varA = 0
    let varB = 0

    for (let i = 0; i < pairsA.length; i++) {
      const diffA = pairsA[i] - meanA
      const diffB = pairsB[i] - meanB
      covariance += diffA * diffB
      varA += diffA * diffA
      varB += diffB * diffB
    }

    covariance /= pairsA.length - 1
    varA /= pairsA.length - 1
    varB /= pairsB.length - 1

    const stdDevA = Math.sqrt(varA)
    const stdDevB = Math.sqrt(varB)

    // Calculate Pearson correlation coefficient
    if (stdDevA === 0 || stdDevB === 0) {
      return 0 // Avoid division by zero
    }

    return covariance / (stdDevA * stdDevB)
  }

  const getColorForCorrelation = (correlation: number): string => {
    // Color scale from red (negative correlation) to white (no correlation) to green (positive correlation)
    if (correlation > 0.8) return "bg-green-800"
    if (correlation > 0.6) return "bg-green-600"
    if (correlation > 0.4) return "bg-green-400"
    if (correlation > 0.2) return "bg-green-200"
    if (correlation > -0.2) return "bg-gray-200"
    if (correlation > -0.4) return "bg-red-200"
    if (correlation > -0.6) return "bg-red-400"
    if (correlation > -0.8) return "bg-red-600"
    return "bg-red-800"
  }

  const handleCellHover = (rowIndex: number, colIndex: number) => {
    setHoveredStock(stocksData[rowIndex])
  }

  const handleCellLeave = () => {
    setHoveredStock(null)
  }

  if (loading) {
    return <Skeleton className="h-[500px] w-full" />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (stocksData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p>No stock data available for correlation analysis</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hoveredStock && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2">
              {hoveredStock.name} ({hoveredStock.ticker})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Price</p>
                <p className="font-medium">${hoveredStock.average.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Standard Deviation</p>
                <p className="font-medium">${hoveredStock.stdDev.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Points</p>
                <p className="font-medium">{hoveredStock.prices.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volatility</p>
                <p className="font-medium">{((hoveredStock.stdDev / hoveredStock.average) * 100).toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Color legend */}
          <div className="flex justify-center items-center mb-4">
            <div className="flex items-center space-x-2">
              <span>Strong Negative</span>
              <div className="flex space-x-1">
                <div className="w-6 h-6 bg-red-800"></div>
                <div className="w-6 h-6 bg-red-600"></div>
                <div className="w-6 h-6 bg-red-400"></div>
                <div className="w-6 h-6 bg-red-200"></div>
                <div className="w-6 h-6 bg-gray-200"></div>
                <div className="w-6 h-6 bg-green-200"></div>
                <div className="w-6 h-6 bg-green-400"></div>
                <div className="w-6 h-6 bg-green-600"></div>
                <div className="w-6 h-6 bg-green-800"></div>
              </div>
              <span>Strong Positive</span>
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="grid" style={{ gridTemplateColumns: `auto repeat(${stocksData.length}, 1fr)` }}>
            {/* Empty top-left cell */}
            <div className="border p-2"></div>

            {/* Column headers */}
            {stocksData.map((stock, index) => (
              <div
                key={`col-${index}`}
                className="border p-2 font-medium text-center"
                onMouseEnter={() => setHoveredStock(stock)}
                onMouseLeave={handleCellLeave}
              >
                {stock.ticker}
              </div>
            ))}

            {/* Rows */}
            {stocksData.map((rowStock, rowIndex) => (
              <React.Fragment key={`row-fragment-${rowIndex}`}>
                {/* Row header */}
                <div
                  key={`row-${rowIndex}`}
                  className="border p-2 font-medium"
                  onMouseEnter={() => setHoveredStock(rowStock)}
                  onMouseLeave={handleCellLeave}
                >
                  {rowStock.ticker}
                </div>

                {/* Cells */}
                {correlationMatrix[rowIndex]?.map((correlation, colIndex) => (
                  <div
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={`border p-2 text-center ${getColorForCorrelation(correlation)}`}
                    onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                    onMouseLeave={handleCellLeave}
                  >
                    {correlation.toFixed(2)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-4">
        <p>Correlation values range from -1 (perfect negative correlation) to 1 (perfect positive correlation).</p>
        <p>0 indicates no correlation between the stock prices.</p>
        <p>Hover over stock tickers or correlation cells to see more details.</p>
      </div>
    </div>
  )
}
