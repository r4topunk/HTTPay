import React from "react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import type { RegisterToolFormData } from "./types";

interface RegisterToolFormProps {
  registerForm: UseFormReturn<RegisterToolFormData>;
  onRegisterSubmit: (values: RegisterToolFormData) => Promise<void>;
  loading: boolean;
}

export const RegisterToolForm: React.FC<RegisterToolFormProps> = ({
  registerForm,
  onRegisterSubmit,
  loading,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Register a New Tool</CardTitle>
        <CardDescription>
          Add your service to the HTTPay registry for AI agents to discover and use
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...registerForm}>
          <form
            onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
            className="space-y-6"
          >
            <FormField
              control={registerForm.control}
              name="toolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool ID</FormLabel>
                  <FormControl>
                    <Input placeholder="my-awesome-tool" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique identifier for your tool
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe what your tool does..." {...field} />
                  </FormControl>
                  <FormDescription>
                    A brief description of your tool's functionality
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Call (NTRN)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      placeholder="1.0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How much to charge per API call in NTRN
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Endpoint</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/my-tool" {...field} />
                  </FormControl>
                  <FormDescription>
                    The URL where your service can be accessed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Tool"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
