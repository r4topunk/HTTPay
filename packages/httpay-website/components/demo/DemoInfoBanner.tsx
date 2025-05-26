import React from "react";
import { Info } from "lucide-react";

export const DemoInfoBanner: React.FC = () => (
  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3 max-w-4xl mx-auto">
    <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-sm font-medium">Live Demo</p>
      <p className="text-sm text-muted-foreground mt-1">
        This demo connects to the HTTPay smart contracts. Configure your SDK settings and connect your wallet to get started.
      </p>
    </div>
  </div>
);
