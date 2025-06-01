import { Database, LockKeyhole, Unlock, Bot, Server, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SolutionSection() {
  return (
    <section id="solution" className="section-container">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The Solution</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A decentralized marketplace where developers monetize APIs and AI agents discover and pay autonomously
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-medium">How It Works</h3>
                <p className="text-lg text-muted-foreground">
                  HTTPay creates a two-stage marketplace: developers register APIs with pricing in the Registry Contract, then agents discover these APIs and use the Escrow Contract for secure payments.
                </p>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Registry Contract
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Developers register their APIs with metadata, pricing, and endpoints. Agents discover available APIs through the on-chain marketplace registry.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LockKeyhole className="h-5 w-5 text-primary" />
                      Escrow Contract
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Agents lock payment in escrow before service execution. Funds are only released when the service
                      is successfully delivered.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="relative bg-muted p-1 rounded-lg border">
              <div className="w-full aspect-[4/3] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-md">
                    {/* Architecture Diagram */}
                    <div className="bg-background rounded-lg p-6 border">
                      <div className="space-y-8">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-primary/10 rounded-full">
                              <Bot className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-sm font-medium">AI Agent</span>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-primary/10 rounded-full">
                              <Server className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-sm font-medium">Provider</span>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-0.5 bg-muted-foreground/20"></div>

                          <div className="relative z-10 bg-background p-4 rounded-lg border mb-6">
                            <div className="flex items-center gap-2">
                              <Database className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                <p className="text-sm font-medium">1. API Discovery</p>
                                <p className="text-xs text-muted-foreground">
                                  Agent queries marketplace registry for available APIs
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="relative z-10 bg-background p-4 rounded-lg border mb-6">
                            <div className="flex items-center gap-2">
                              <LockKeyhole className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                <p className="text-sm font-medium">2. Lock Payment</p>
                                <p className="text-xs text-muted-foreground">Agent locks funds in escrow contract</p>
                              </div>
                            </div>
                          </div>

                          <div className="relative z-10 bg-background p-4 rounded-lg border mb-6">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                <p className="text-sm font-medium">3. Service Execution</p>
                                <p className="text-xs text-muted-foreground">Provider delivers the requested service</p>
                              </div>
                            </div>
                          </div>

                          <div className="relative z-10 bg-background p-4 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <Unlock className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                <p className="text-sm font-medium">4. Release Payment</p>
                                <p className="text-xs text-muted-foreground">
                                  Funds are released to provider upon verification
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
