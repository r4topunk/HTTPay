import { TrendingUp, Globe, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function MarketOpportunitySection() {
  return (
    <section id="market" className="section-container bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Market Opportunity</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The convergence of AI and Web3 creates unprecedented opportunities
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold">$18 Billion Market</h3>
                      <p className="text-lg text-muted-foreground">
                        The global API marketplace was valued at USD 18.00 billion in 2024
                      </p>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          18.9% CAGR through 2030
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 flex gap-4 items-start">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium">First Mover Advantage</h3>
                      <p className="text-muted-foreground">
                        HTTPay is the first API marketplace designed specifically for autonomous consumers in the Cosmos ecosystem
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex gap-4 items-start">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium">Perfect Timing</h3>
                      <p className="text-muted-foreground">
                        The explosion of AI agents and Web3 programmable assets creates the ideal environment for autonomous API marketplaces
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-8 rounded-lg border border-muted">
              <div className="space-y-6">
                <h3 className="text-2xl font-medium">The AI + Web3 Convergence</h3>
                <p className="text-lg">
                  We're witnessing an unprecedented convergence that positions Cosmos at the forefront:
                </p>
                <ul className="space-y-4 list-disc pl-5">
                  <li>
                    <strong>Autonomous AI Decision-Making:</strong> Advanced agents capable of independent choices
                  </li>
                  <li>
                    <strong>Programmable Digital Assets:</strong> Blockchain enables automated financial execution
                  </li>
                  <li>
                    <strong>24/7 Operations:</strong> APIs that were underutilized can now serve thousands of agents continuously
                  </li>
                  <li>
                    <strong>Microtransaction Economy:</strong> Cosmos's low fees enable profitable small payments
                  </li>
                </ul>
                <div className="bg-primary/10 p-4 rounded-lg mt-6">
                  <p className="text-lg font-medium text-primary">
                    HTTPay captures this opportunity by creating infrastructure for the autonomous agent economy
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Source: <a href="https://www.grandviewresearch.com/industry-analysis/api-marketplace-market-report" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Grand View Research - API Marketplace Market Report
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
