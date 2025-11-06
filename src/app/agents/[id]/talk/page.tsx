"use client";
import TalkToAgentSvg from "@/components/ui/talk_to_agent_svg";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TAgent, TFetched } from "@/types";
import { getAgent } from "@/lib/api/agents";
import dynamic from "next/dynamic";

const AgentInteraction = dynamic(() => import("./WebsocketConnection"), {
  ssr: false,
});

export default function TalkToAgentPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<TFetched<TAgent>>({
    data: undefined,
    loading: true,
  });

  useEffect(() => {
    async function fetchAgent() {
      try {
        const call = await getAgent(id);
        console.log(call);
        setAgent({ data: call, loading: false, error: undefined });
      } catch (error: any) {
        setAgent({ data: undefined, loading: false, error: error.message });
      }
    }

    fetchAgent();
  }, [id]);

  return (
    <div
      className={
        "flex flex-col h-full items-center justify-start glassy-background py-20 dark:glassy-background-dark "
      }
    >
      <TalkToAgentSvg className="breathing mb-5" />

      {agent.data && (
        <AgentInteraction
          agent={agent.data}
          onConnect={() => {}}
          onDisconnect={() => {}}
        />
      )}
    </div>
  );
}
