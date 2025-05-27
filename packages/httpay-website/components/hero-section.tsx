"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"
import { useChain } from "@cosmos-kit/react"
import { defaultChainName } from "@/config/chain-config"
import { ConnectButton } from "./wallet/connect-button"

export default function HeroSection() {
  const { address } = useChain(defaultChainName)

  return (
    <section id="hero" className="section-container relative">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="container mx-auto flex flex-col items-center justify-center text-center z-10 space-y-8">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400">
            {APP_NAME}
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl">Autonomous Payments for AI Agents</p>
        <p className="text-lg max-w-2xl">
          Enabling AI agents to autonomously pay for services without human intervention
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          {/* Use the ConnectButton component instead of the inline button */}
          {!address && <ConnectButton />}

          {/* Make Try Demo the primary action when connected */}
          <Button size="lg" variant={address ? "default" : "outline"} asChild>
            <a href="#demo">Try Demo</a>
          </Button>
        </div>
        <a
          href="#problem"
          className="absolute bottom-8 animate-bounce cursor-pointer"
          aria-label="Scroll to Problem section"
        >
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </a>
      </div>
    </section>
  )
}
