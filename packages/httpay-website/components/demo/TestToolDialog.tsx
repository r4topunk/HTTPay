import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatAmount } from "@/lib/constants";

interface TestToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTool: any;
  testStatus: "idle" | "creating_escrow" | "requesting_service" | "success" | "error";
  escrowId: string;
  executeToolTest: () => void;
}

export const TestToolDialog: React.FC<TestToolDialogProps> = ({
  open,
  onOpenChange,
  selectedTool,
  testStatus,
  escrowId,
  executeToolTest,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Tool: {selectedTool?.tool_id}</DialogTitle>
          <DialogDescription>
            Execute a real transaction to test this tool via the HTTPay protocol
          </DialogDescription>
        </DialogHeader>
        {testStatus === "idle" ? (
          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p className="text-sm font-medium">Tool Details</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTool?.description || "No description available"}
                </p>
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium">Price per Call</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN
                </p>
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium">Number of Calls</p>
                <p className="text-sm text-muted-foreground">
                  1 call (fixed for demo)
                </p>
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium">Total Cost</p>
                <p className="text-sm font-semibold">
                  {selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will create a real escrow transaction on the blockchain and attempt to call the service endpoint.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={executeToolTest}>
                Execute Test
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Status:</p>
                <p className="text-sm">
                  {testStatus === "creating_escrow" && "Creating escrow..."}
                  {testStatus === "requesting_service" && "Requesting service..."}
                  {testStatus === "success" && "Test completed successfully"}
                  {testStatus === "error" && "Error occurred"}
                </p>
              </div>
              {escrowId && (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Escrow ID:</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {escrowId}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-center py-4">
              {(testStatus === "creating_escrow" || testStatus === "requesting_service") && (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              )}
              {testStatus === "success" && (
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              )}
              {testStatus === "error" && (
                <AlertCircle className="h-12 w-12 text-destructive" />
              )}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {testStatus === "creating_escrow" &&
                "Creating an escrow on the blockchain and locking funds..."}
              {testStatus === "requesting_service" &&
                "Escrow created! Now requesting the service from the provider..."}
              {testStatus === "success" &&
                "The tool was successfully tested through the HTTPay protocol"}
              {testStatus === "error" &&
                "There was an error processing your request"}
            </div>
            <DialogFooter>
              {testStatus === "success" || testStatus === "error" ? (
                <Button onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              ) : (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
