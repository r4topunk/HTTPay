import { Bot, AlertTriangle, Hourglass, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ProblemSection() {
  return (
    <section id="problem" className="section-container bg-muted/30">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The Problem & Opportunity</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Both developers and AI agents face significant barriers in the current API economy
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">Limited API Monetization</h3>
                    <p className="text-muted-foreground">
                      Developers struggle to monetize APIs with complex billing, manual integrations, and limited discoverability by autonomous systems.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">Limited Autonomy</h3>
                    <p className="text-muted-foreground">
                      AI agents lack the ability to make payments without human approval, creating bottlenecks in
                      automated workflows.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">Trust Issues</h3>
                    <p className="text-muted-foreground">
                      Service providers have no guarantee of payment, while agents have no guarantee of service
                      delivery, creating a trust gap.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Hourglass className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">Delayed Transactions</h3>
                    <p className="text-muted-foreground">
                      Traditional payment systems introduce latency that disrupts real-time AI operations and
                      decision-making processes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-8 rounded-lg border border-muted">
              <div className="space-y-6">
                <h3 className="text-2xl font-medium">The Opportunity</h3>
                <p className="text-lg">
                  The opportunity is massive: APIs that previously served just a few users can now be monetized by thousands of autonomous agents running 24/7:
                </p>
                <ul className="space-y-4 list-disc pl-5">
                  <li><strong>For Developers:</strong> Create new automated revenue streams without complex billing management</li>
                  <li><strong>For AI Agents:</strong> Instant access to specialized services without human configuration</li>
                  <li>Make autonomous payments without human intervention</li>
                  <li>Guarantee payment only upon service delivery</li>
                  <li>Discover and pay for services in real-time</li>
                  <li>Operate with minimal latency for time-sensitive tasks</li>
                  <li>Maintain a transparent record of all transactions</li>
                </ul>
                <p className="text-lg font-medium text-primary">
                  HTTPay unlocks this opportunity with the first API marketplace designed for autonomous consumers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
