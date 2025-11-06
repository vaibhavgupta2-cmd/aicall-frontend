"use client";

import CallStatusDisplay from "@/components/CallStatusDisplay";
import Loading from "@/components/Loading";
import { Header } from "@/components/Typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ShineBorder from "@/components/ui/shine-border";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import useUser from "@/hooks/useUser";
import { getAgent } from "@/lib/api/agents";
import { getCall } from "@/lib/api/call";
import { toCapitalizedSentence } from "@/lib/utils";
import { TAgent, TCall, TFetched } from "@/types";
import { Calendar, MessageSquare, Phone, Sparkles, User, RotateCcw } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { retryCall } from "@/lib/api/cron";

function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    completed:
      "bg-gradient-to-r from-[hsl(142,_76%,_36%)] to-[hsl(142,_76%,_36%,_0.1)] text-[hsl(142,_76%,_96%)]",
    pending:
      "bg-gradient-to-r from-[hsl(48,_96%,_53%)] to-[hsl(48,_96%,_53%,_0.1)] text-[hsl(48,_96%,_93%)]",
    failed:
      "bg-gradient-to-r from-[hsl(var(--destructive))] to-[hsl(var(--destructive)_/_0.1)] text-[hsl(var(--destructive-foreground))]",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-[hsl(var(--border))] ${
        statusColors[status as keyof typeof statusColors]
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Helper function to safely display field values
function getDisplayValue(value: any): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return "N/A";
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return "Invalid data";
    }
  }
  
  return String(value);
}

function App() {
  const { id } = useParams<{ id: string }>();

  const { organisation, loading } = useUser();

  const [call, setCall] = useState<TFetched<TCall>>({
    data: undefined,
    loading: true,
  });

  const [agent, setAgent] = useState<TFetched<TAgent>>({
    data: undefined,
    loading: true,
  });

  const [retryLoading, setRetryLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchAgent = async () => {
      if (!call.data) {
        return;
      }

      try {
        const res = await getAgent(call.data.agentId);
        setAgent({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setAgent({ loading: false, data: undefined, error: error.message });
        toast({
          title: "Error fetching campaign",
          description: error.message,
        });
      }
    };

    fetchAgent();
  }, [call.data, toast]);

  useEffect(() => {
    async function fetchCall() {
      try {
        const call = await getCall(id);
        setCall({ data: call, loading: false, error: undefined });
      } catch (error: any) {
        setCall({ data: undefined, loading: false, error: error.message });
      }
    }

    fetchCall();
  }, [id]);

  // Handle retry call
  const handleRetryCall = async () => {
    if (!id) return;

    setRetryLoading(true);
    try {
      await retryCall(id);
      toast({
        title: "Call Retry Initiated",
        description: "The call has been queued for retry successfully.",
      });
      
      // Optionally refresh the call data after retry
      const updatedCall = await getCall(id);
      setCall({ data: updatedCall, loading: false, error: undefined });
    } catch (error: any) {
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry the call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRetryLoading(false);
    }
  };

  // Generate the authenticated proxy URL for the recording
  const getAuthenticatedRecordingUrl = (recordUrl: string) => {
    // Encode the original Exotel URL to pass it to our proxy
    const encodedUrl = encodeURIComponent(recordUrl);
    return `/api/recording-proxy?url=${encodedUrl}`;
  };

  if (loading || call.loading) {
    return <Loading />;
  }

  if (call.error || !call.data) {
    return <div>{call.error || "Call not found"}</div>;
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-background to-muted pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-fade-in">
          <div className="animate-fade-in ">
            <Header className="text-3xl font-bold md:text-4xl mb-3 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent flex flex-row items-center">
              <Phone className="w-8 h-8 text-[hsl(var(--primary))]" />
              Call Details
            </Header>
            <p className="text-lg text-muted-foreground">
              Detailed overview of the conversation and extracted insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRetryCall}
              disabled={retryLoading}
              variant="outline"
              className="flex items-center gap-2 hover:bg-accent"
            >
              <RotateCcw className={`w-4 h-4 ${retryLoading ? 'animate-spin' : ''}`} />
              {retryLoading ? 'Retrying...' : 'Retry Call'}
            </Button>
            <StatusBadge status={call.data.status} />
            <div className="flex items-center gap-2 bg-accent px-4 py-2 rounded-xl border border-border shadow-sm">
              <div className="relative">
                <User className="w-5 h-5 text-[hsl(var(--primary))]" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-2.5 h-2.5 text-[hsl(var(--primary-foreground))]" />
                </span>
              </div>
              <span className="font-medium text-accent-foreground">
                {agent.data?.name || "Unknown Agent"}
              </span>
            </div>
          </div>
        </div>

        {/* Call Info Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              {call.data.timestamp
                ? new Date(call.data.timestamp * 1000).toLocaleString()
                : "N/A"}
            </span>
          </div>

          {/* Extraction Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {call.data.extractionFieldsValues && call.data.extractionFieldsValues.length > 0 ? (
              call.data.extractionFieldsValues.map((field, index) => {
                // Safe handling of field name and value
                const fieldName = field?.name || `Field ${index + 1}`;
                const fieldValue = getDisplayValue(field?.value);
                const isNullValue = field?.value === null || field?.value === undefined || 
                                  (typeof field?.value === 'string' && field.value.trim() === '');

                return (
                  <div
                    key={`${fieldName}-${index}`}
                    className={`bg-gradient-to-br from-accent to-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in ${
                      isNullValue ? 'opacity-60' : ''
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                    </h3>
                    <p className={`text-lg font-semibold ${
                      isNullValue 
                        ? 'text-muted-foreground italic' 
                        : 'text-card-foreground'
                    }`}>
                      {fieldValue}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-8">
                <p>No extraction fields available</p>
              </div>
            )}
          </div>
        </div>

        <div className="my-10 grid gap-4">
          <div className="flex justify-between items-center">
            <Header>Transcript</Header>
            {call.data.record_url ? (
              <audio controls preload="metadata" className="w-full max-w-md">
                <source 
                  src={getAuthenticatedRecordingUrl(call.data.record_url)} 
                  type="audio/mpeg" 
                />
                <source 
                  src={getAuthenticatedRecordingUrl(call.data.record_url)} 
                  type="audio/wav" 
                />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div className="text-muted-foreground">Recording not available</div>
            )}
          </div>

          {/* Transcript Section */}
          <ShineBorder
            className="rounded-lg border w-full md:shadow-xl"
            color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          >
            <Card className="p-2 child:p-2 w-full h-96 overflow-y-auto">
              {call.data.transcript ? (
                call.data.transcript
                  .replaceAll("BOT", "$BOT")
                  .replaceAll("HUMAN", "$HUMAN")
                  .substring(1, call.data.transcript.length - 1)
                  .split("$")
                  .filter(line => line.trim()) // Filter out empty lines
                  .map((line, i) => {
                    const isBot = line.startsWith("BOT");
                    let content: string;
                    if (line.search("BOT") !== -1) {
                      content = line.replace("BOT:", "").trim() + " 🤖";
                    } else {
                      content = "🧑 " + line.replace("HUMAN:", "").trim();
                    }
                    
                    // Skip empty content
                    if (!content.trim() || content.trim() === "🤖" || content.trim() === "🧑") {
                      return null;
                    }

                    return (
                      <Card
                        className={`p-2 m-2 child:p-2  ${
                          isBot ? "bg-blue-200 w-fit ml-auto" : "bg-green-200 w-fit"
                        }`}
                        key={i}
                      >
                        <CardContent className="pt-0">
                          <p className="text-xl text-gray-700">{content}</p>
                        </CardContent>
                      </Card>
                    );
                  })
                  .filter(Boolean) // Remove null entries
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No transcript available</p>
                </div>
              )}
            </Card>
          </ShineBorder>
        </div>
      </div>
    </div>
  );
}

export default App;