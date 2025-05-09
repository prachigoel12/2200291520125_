import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("http://20.244.56.144/evaluation-service/stocks", {
      headers: {
        Accept: "application/json",
      },
      // This is important for server-side requests
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching stocks:", error)

    // Return mock data as fallback
    const mockStocks = {
      stocks: {
        "Apple Inc.": "AAPL",
        "Microsoft Corporation": "MSFT",
        "Amazon.com, Inc.": "AMZN",
        "Alphabet Inc. Class A": "GOOGL",
        "Meta Platforms, Inc.": "META",
        "Tesla, Inc.": "TSLA",
        "Nvidia Corporation": "NVDA",
        "Berkshire Hathaway Inc.": "BRKB",
        "JPMorgan Chase & Co.": "JPM",
        "Johnson & Johnson": "JNJ",
      },
    }

    return NextResponse.json(mockStocks)
  }
}
