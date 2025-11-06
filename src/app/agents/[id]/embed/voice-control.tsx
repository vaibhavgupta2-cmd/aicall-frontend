import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../../../../components/ui/use-toast";
import AIConversationClient from "@/lib/api/webSocket";
import { v4 as uuidv4 } from "uuid";

type VoiceControlProps = {
  agent: any; // Replace with your agent type
  onDisconnect: () => void;
  onConnect: () => void;
};

export default function VoiceControl({
  agent,
  onDisconnect,
  onConnect,
}: VoiceControlProps) {
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
    <div className="card">
      <input
        id="recording"
        type="checkbox"
        onChange={isRecording ? stopRecording : startRecording}
        value={isRecording ? "recording" : "not-recording"}
      />
      <label htmlFor="recording">
        <div className="outer-circle">
          <div className="sound-lines">
            {Array.from({ length: 100 }, (_, index) => (
              <div
                key={index}
                id={`sound-line${index}`}
                className="sound-line"
              ></div>
            ))}
          </div>
          <div className="inner-circle">
            <div className="mic">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 512 512"
                version="1.1"
                fill="#000000"
              >
                <defs>
                  <linearGradient id="linearGradient10">
                    <stop
                      offset="0"
                      style={{ stopColor: "#ffffff", stopOpacity: 0.654 }}
                    />
                    <stop
                      offset="1"
                      style={{ stopColor: "#ffffff", stopOpacity: 0.401 }}
                    />
                  </linearGradient>
                  <linearGradient
                    gradientUnits="userSpaceOnUse"
                    y2="429.50262"
                    x2="315.74176"
                    y1="82.497337"
                    x1="196.25827"
                    id="linearGradient11"
                    xlinkHref="#linearGradient10"
                  ></linearGradient>
                </defs>
                <g style={{ fill: "url(#linearGradient11)", fillOpacity: 1 }}>
                  <path d="m 439.5,236 c 0,-11.3 -9.1,-20.4 -20.4,-20.4 -11.3,0 -20.4,9.1 -20.4,20.4 0,70 -64,126.9 -142.7,126.9 -78.7,0 -142.7,-56.9 -142.7,-126.9 0,-11.3 -9.1,-20.4 -20.4,-20.4 -11.3,0 -20.4,9.1 -20.4,20.4 0,86.2 71.5,157.4 163.1,166.7 v 36.87741 A 20.622587,20.622587 45 0 0 256.22259,460.2 20.401214,20.401214 134.37486 0 0 276.4,439.57741 V 402.7 C 368,393.4 439.5,322.2 439.5,236 Z"></path>
                  <path d="m 256,323.5 c 51,0 92.3,-41.3 92.3,-92.3 V 103.3 C 348.3,52.3 307,11 256,11 c -51,0 -92.3,41.3 -92.3,92.3 v 127.9 c 0,51 41.3,92.3 92.3,92.3 z"></path>
                  <path
                    style={{
                      fill: "none",
                      fillOpacity: 0.719,
                      stroke: "none",
                      strokeWidth: 0,
                      strokeDasharray: "none",
                      strokeOpacity: 1,
                    }}
                    d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5 52.3-52.3 52.3s-52.3-23.5-52.3-52.3v-127.9z"
                  ></path>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}
