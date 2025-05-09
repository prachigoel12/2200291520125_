import StockDashboard from "@/components/stock-dashboard"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Stock Price Aggregator</h1>
        <p className="text-muted-foreground">Real-time analytical insights for stock prices</p>
      </header>
      <StockDashboard />
    </main>
  )
}
