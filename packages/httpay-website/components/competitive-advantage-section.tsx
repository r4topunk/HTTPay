import { CheckCircle, X, Users, Bot } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CompetitiveAdvantageSection() {
  return (
    <section id="competitive" className="section-container bg-muted/30">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why HTTPay is Different</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The first API marketplace designed specifically for autonomous consumers
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">HTTPay</CardTitle>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                    Autonomous-First
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Programmatic API discovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Autonomous payment execution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Smart contract escrow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Instant microtransactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Zero human intervention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Cosmos ecosystem benefits</span>
                  </div>
                </div>
                <div className="pt-4 text-sm text-muted-foreground">
                  <strong>Target:</strong> Thousands of autonomous agents operating 24/7
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-muted-foreground" />
                  <CardTitle className="text-xl text-muted-foreground">RapidAPI</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Human-Focused
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Dashboard-based discovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Manual payment setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Credit card billing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Human approval required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Complex integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Traditional Web2 infrastructure</span>
                  </div>
                </div>
                <div className="pt-4 text-sm text-muted-foreground">
                  <strong>Target:</strong> Human developers with manual workflows
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-muted-foreground" />
                  <CardTitle className="text-xl text-muted-foreground">Traditional APIs</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Legacy
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">API key management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Custom payment integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Manual billing management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">No discovery mechanism</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Trust-based transactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-sm">Limited scalability</span>
                  </div>
                </div>
                <div className="pt-4 text-sm text-muted-foreground">
                  <strong>Target:</strong> Individual developers or small teams
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-8 border text-center space-y-6">
            <h3 className="text-2xl font-medium">The Autonomous Advantage</h3>
            <p className="text-lg max-w-3xl mx-auto">
              While existing marketplaces focus on human developers with dashboards and manual billing, 
              HTTPay is purpose-built for the autonomous agent economy where thousands of AI agents 
              need to dynamically discover and consume APIs without human intervention.
            </p>
            <div className="grid md:grid-cols-2 gap-6 pt-6 max-w-4xl mx-auto">
              <div className="text-left">
                <h4 className="font-semibold mb-2">Traditional API Economy</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Manual API discovery via documentation</li>
                  <li>• Human-configured authentication</li>
                  <li>• Credit card or invoice billing</li>
                  <li>• Limited to business hours</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="font-semibold mb-2">HTTPay Autonomous Economy</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Programmatic API registry queries</li>
                  <li>• Smart contract authentication</li>
                  <li>• Instant cryptocurrency payments</li>
                  <li>• 24/7 autonomous operations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
