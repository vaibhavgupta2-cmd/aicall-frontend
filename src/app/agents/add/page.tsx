"use client";

// import { createLead } from "@/lib/cus";
import { useToast } from "@/components/ui/use-toast";
import useUser from "@/hooks/useUser";
import { createAgent } from "@/lib/api/agents";
import { useState } from "react";
import AgentInput, { TAgentData } from "../AgentInput";

function Page() {
  const { organisation } = useUser();
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (data: TAgentData) => {
    if (!organisation) {
      toast({
        title: "Error creating agent",
        description: "Organisation not found",
        variant: "destructive",
      });
      return;
    }
    if (uploading) {
      toast({
        title: "Agent is being created",
        description: "Please wait",
      });
      return;
    }
    setUploading(true);
    try {
      const agent = await createAgent({
        ...data,
        organisationId: organisation.uid,
      });
      toast({
        title: "Agent created",
        description: `Agent "${agent.name}" created`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating agent",
        description: error.message,
      });
    }
    setUploading(false);
    window.location.href = "/agents";
  };

  return (
    <AgentInput
      canSubmit={!uploading}
      onSubmit={handleSubmit}
      actionName="Create"
    />
  );
}

export default Page;
