import { useEffect, useRef, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { TAgent, TFetched } from "@/types";
import { getAgent } from "@/lib/api/agents";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
const VoiceControl = dynamic(() => import("./voice-control"), {
  ssr: false,
});

const EmbedTalk = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  ); // State for messages
  const [newMessage, setNewMessage] = useState(""); // State for new message input
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    setMessages([...messages, { text: newMessage, sender: "You" }]);
    setNewMessage("");
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="bg-none bg-transparent">
      {/* Open Chat Button */}
      <Button
        variant="default"
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-5 right-5 z-[9999]
          w-14 h-14
          flex justify-center items-center
          rounded-full
          shadow-xl
          ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      <div
        className={`
          fixed bottom-5 right-5 z-[9999]
          transition-all duration-300 ease-in-out
          ${
            isOpen
              ? "opacity-100 w-80 md:w-96  h-auto pointer-events-auto"
              : "opacity-0 w-0 h-0 pointer-events-none"
          }
        `}
      >
        <Card className="w-full h-full rounded-[20px] shadow-2xl">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-20"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="px-4">
            <Tabs defaultValue="chat" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="voice">Voice Talk</TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat">
                <div className="flex flex-col h-[350px]">
                  {/* Message List */}
                  <div className="flex-1 overflow-y-auto border p-4 rounded-md ">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center">
                        No messages yet
                      </p>
                    ) : (
                      messages.map((message, index) => (
                        <div key={index} className="mb-2">
                          <p className="font-semibold text-sm text-gray-500">
                            {message.sender}:
                          </p>
                          <p className="text-white">{message.text}</p>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="flex mt-4 ">
                    {/* <input
                      type="text"
                      className="flex-1 p-2 rounded-l-md focus:outline-none"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.code === "Enter") {
                          handleSendMessage();
                        }
                      }}
                    /> */}
                    <Input
                      type="text"
                      className="flex-1 p-2 rounded-l-md focus:outline-none"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.code === "Enter") {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="rounded-l-none h-full"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Voice Talk Tab */}
              <TabsContent value="voice">
                <Card className="mt-2 h-96">
                  <CardHeader>
                    <CardTitle>Voice Talk</CardTitle>
                    <CardDescription>
                      Talk to the system using voice input.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="">
                      {agent.data && (
                        <VoiceControl
                          agent={agent.data}
                          onConnect={() => {}}
                          onDisconnect={() => {}}
                        />
                      )}

                      {/* {agent.data && (
                        <AgentInteraction
                          agent={agent.data}
                          onConnect={() => {}}
                          onDisconnect={() => {}}
                        />
                      )} */}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmbedTalk;
