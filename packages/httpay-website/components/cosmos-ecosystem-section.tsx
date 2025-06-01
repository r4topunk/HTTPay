import { Network, Zap, Shield, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CosmosEcosystemSection() {
  return (
    <section id="cosmos" className="section-container">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built on Cosmos</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leveraging the power of the Cosmos ecosystem for autonomous agent payments
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Network className="h-5 w-5 text-primary" />
                      Inter-Blockchain Communication (IBC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Agents on different networks can seamlessly use HTTPay protocols, expanding the marketplace's reach across the entire Cosmos ecosystem and beyond.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Low-Cost Microtransactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Cosmos's scalability and low fees enable profitable microtransactions, perfect for fast agent interactions where traditional payment methods are too expensive.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      CosmWasm Smart Contracts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Advanced smart contract capabilities enable complex escrow logic, automated payments, and trustless execution without compromising security.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Ecosystem Positioning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      HTTPay positions Cosmos at the forefront of the AI + Web3 convergence, attracting autonomous agent developers to the ecosystem.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-8 rounded-lg border border-muted">
              <div className="space-y-6">
                <h3 className="text-2xl font-medium">Why Cosmos for Autonomous Agents?</h3>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Interoperability First</h4>
                    <p className="text-sm text-muted-foreground">
                      Agents can operate across multiple chains without being locked into a single ecosystem
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Application-Specific Chains</h4>
                    <p className="text-sm text-muted-foreground">
                      Custom blockchain logic optimized for agent-to-agent transactions and API marketplace operations
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Sovereign Security</h4>
                    <p className="text-sm text-muted-foreground">
                      Decentralized validation ensures no single point of failure for critical autonomous operations
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Developer-Friendly</h4>
                    <p className="text-sm text-muted-foreground">
                      CosmWasm's flexibility enables rapid iteration and complex business logic implementation
                    </p>
                  </div>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg mt-6">
                  <p className="text-lg font-medium text-primary">
                    Perfect infrastructure for millions of agents transacting across interconnected networks
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">~3 sec</div>
              <div className="text-sm text-muted-foreground">Average block time</div>
              <div className="text-xs text-muted-foreground mt-1">Fast enough for real-time agent decisions</div>
            </div>
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">$0.01</div>
              <div className="text-sm text-muted-foreground">Typical transaction fee</div>
              <div className="text-xs text-muted-foreground mt-1">Enables profitable microtransactions</div>
            </div>
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Connected blockchains</div>
              <div className="text-xs text-muted-foreground mt-1">Massive agent market reach via IBC</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
