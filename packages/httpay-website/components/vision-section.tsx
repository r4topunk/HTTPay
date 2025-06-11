import { Github, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { APP_NAME } from "@/lib/constants"
import Link from "next/link"

export default function VisionSection() {
  return (
    <section id="vision" className="section-container">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12 max-w-4xl mx-auto">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Infrastructure for the Agentic Economy</h2>
            <p className="text-xl text-muted-foreground">HTTPay is designed to become fundamental infrastructure for the autonomous agent economy</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-medium">Roadmap</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Reputation system for enhanced security and trust</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>ATOM staking requirements for API registration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Eliza and LangChain framework integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Multi-token support for cross-chain payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Decentralized governance through a DAO</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Subscription-based payment models</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-medium">Get Involved</h3>
                <p className="text-muted-foreground">
                  {APP_NAME} is an open-source project that welcomes contributions from developers, AI researchers, and
                  blockchain enthusiasts. Join us in building the future of autonomous AI payments.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button className="gap-2" asChild>
                    <Link href="https://github.com/r4topunk/httpay" target="_blank" rel="noopener noreferrer">
                      <Github className="h-5 w-5" />
                      GitHub
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-8 border text-center space-y-6">
            <h3 className="text-2xl font-medium">Ready to build with {APP_NAME}?</h3>
            <p className="text-lg max-w-2xl mx-auto">
              Whether you&apos;re developing AI agents or providing services, {APP_NAME} offers a trustless payment protocol
              that enables autonomous transactions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link href="#demo">Try the Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="https://docs.httpay.org" target="_blank" rel="noopener noreferrer">
                  Read the Docs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
