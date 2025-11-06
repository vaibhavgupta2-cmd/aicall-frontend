// components/AgentInteraction.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import AIConversationClient from "@/lib/api/webSocket";
import { EnterIcon, SpaceEvenlyVerticallyIcon } from "@radix-ui/react-icons";
import { Loader2, Mic, MicOff, Space } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface AgentInteractionProps {
  agent: any; // Replace with your agent type
  onDisconnect: () => void;
  onConnect: () => void;
}

export default function AgentInteraction({
  agent,
  onDisconnect,
  onConnect,
}: AgentInteractionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const clientRef = useRef<AIConversationClient | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    function handleKeyDown(e: any) {
      if (e.keyCode === 32) {
        isRecording ? stopRecording() : startRecording();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    // Don't forget to clean up
    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    if (!agent) return;
    console.log(agent);

    try {
      if (!clientRef.current) {
        let userid = uuidv4();
        clientRef.current = new AIConversationClient(userid);
      }

      const config = {
        stt_type: agent.sttType,
        stt_language_id: agent.sttLanguageId,
        tts_type: agent.ttsType,
        tts_voice: agent.ttsVoice,
        agent_config: {
          llm_type: agent.llmType,
          initial_message: agent.initialMessage || "",
          prompt_preamble: agent.promptTemplate || "",
          filler_type: agent.fillerWords,
          bgNoise: agent.bgNoise || false,
        },
      };

      await clientRef.current.connect(config);

      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error starting conversation",
        description: "Failed to initialize audio connection",
        variant: "destructive",
      });
      setIsConnected(false);
      setIsConnecting(false);
      setIsRecording(false);
      onConnect();

      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setIsRecording(false);
    setIsConnected(false);
    onDisconnect();
  };

  return (
    <div
      className="space-y-4 mt-5"
      onKeyDown={(event) => {
        if (event.key === "Space") {
          isRecording ? stopRecording() : startRecording();
        }
      }}
    >
      <div className="flex items-center gap-4">
        {/* <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          className="ml-auto"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Stop Conversation
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Start Conversation
            </>
          )}
        </Button> */}
        <div
          onClick={isRecording ? stopRecording : startRecording}
          className="ml-auto opacity-50 cursor-pointer"
        >
          {isConnecting ? (
            <div>Connecting</div>
          ) : isRecording ? (
            <div className="flex items-center space-x-2">
              <div>Click to Stop Conversation or press </div>
              <Space className="m-auto" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div>Click to Start Conversation or press </div>
              <Space className="m-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
