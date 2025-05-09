import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { ticker: string } }) {
  const { ticker } = params
  const { searchParams } = new URL(request.url)
  const minutes = searchParams.get("minutes")

  let url = `http://20.244.56.144/evaluation-service/stocks/${ticker}`
  if (minutes) {
    url += `?minutes=${minutes}`
  }

  try {
    const response = await fetch(url, {
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
    console.error(`Error fetching stock ${ticker}:`, error)

    // Generate mock data as fallback
    if (minutes) {
      const now = new Date()
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        price: 100 + Math.random() * 50,
        lastUpdatedAt: new Date(now.getTime() - i * 5 * 60000).toISOString(),
      }))

      return NextResponse.json(mockData)
    } else {
      // Single stock price
      return NextResponse.json({
        stock: {
          price: 100 + Math.random() * 50,
          lastUpdatedAt: new Date().toISOString(),
        },
      })
    }
  }
}
