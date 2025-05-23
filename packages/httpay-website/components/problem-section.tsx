import { Bot, AlertTriangle, Hourglass } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ProblemSection() {
  return (
    <section id="problem" className="section-container bg-muted/30">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The Problem</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              AI agents face significant friction when trying to pay for services
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
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
                  As AI agents become more capable, they need a trustless payment protocol that enables them to:
                </p>
                <ul className="space-y-4 list-disc pl-5">
                  <li>Make autonomous payments without human intervention</li>
                  <li>Guarantee payment only upon service delivery</li>
                  <li>Discover and pay for services in real-time</li>
                  <li>Operate with minimal latency for time-sensitive tasks</li>
                  <li>Maintain a transparent record of all transactions</li>
                </ul>
                <p className="text-lg font-medium text-primary">
                  HTTPay solves these challenges with a decentralized payment protocol built specifically for AI agents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
