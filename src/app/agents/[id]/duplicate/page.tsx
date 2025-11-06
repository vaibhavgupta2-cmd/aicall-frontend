"use client";

import Loading from "@/components/Loading";
import { useToast } from "@/components/ui/use-toast";
import useUser from "@/hooks/useUser";
import { createAgent, editAgent, getAgent } from "@/lib/api/agents";
import { TAgent, TFetched } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AgentInput, { TAgentData } from "../../AgentInput";

function Page() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const { id } = useParams<{ id: string }>();

  const { organisation, loading } = useUser();

  const [agent, setAgent] = useState<TFetched<TAgent>>({
    data: undefined,
    loading: true,
  });

  useEffect(() => {
    async function fetchAgent() {
      try {
        const call = await getAgent(id);
        setAgent({ data: call, loading: false, error: undefined });
      } catch (error: any) {
        setAgent({ data: undefined, loading: false, error: error.message });
      }
    }

    fetchAgent();
  }, [id]);
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

    if (!agent.data) {
      toast({
        title: "Please wait",
        description: "Agent data is loading",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const newAgent = {
        ...data,
        organisationId: organisation.uid,
        uid: id,
        createdAt: agent.data.createdAt,
      };

      const response = await createAgent(newAgent);

      toast({
        title: "Agent Created",
        description: `Agent "${agent.data.name}" created`,
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

  if (loading || agent.loading) {
    return <Loading />;
  }

  if (agent.error || !agent.data) {
    return <div>Agent not found</div>;
  }

  return (
    <AgentInput
      initialData={{ ...agent.data }}
      canSubmit={!uploading}
      onSubmit={handleSubmit}
      actionName="Duplicate"
    />
  );
}

export default Page;
