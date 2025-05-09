// Helper functions for API calls

export async function fetchStocks() {
  const response = await fetch("http://20.244.56.144/evaluation-service/stocks")

  if (!response.ok) {
    throw new Error("Failed to fetch stocks")
  }

  return response.json()
}

export async function fetchStockPrices(ticker: string, minutes: number) {
  const response = await fetch(`http://20.244.56.144/evaluation-service/stocks/${ticker}?minutes=${minutes}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch prices for ${ticker}`)
  }

  return response.json()
}
