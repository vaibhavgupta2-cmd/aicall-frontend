"use client";

import { useEffect, useRef, useState } from "react";
import AIConversationClient from "@/lib/api/webSocket";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  Calendar,
  Edit,
  Copy,
  Volume2,
  Trash2,
  Text,
  Languages,
  WholeWord,
  Brain,
  MoreVertical,
  Phone,
  User,
  Sparkles,
  ExternalLink,
  Code,
  Share2,
  Webhook,
  Wind,
  Clock,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import useUser from "@/hooks/useUser";
import { deleteAgent, getAgent } from "@/lib/api/agents";
import { toCapitalizedSentence } from "@/lib/utils";
import { createCustomers } from "@/lib/api/customers";
import {
  CallStatus,
  TAgent,
  TCreateCallADP,
  TCreateCallDTO,
  TCreateCustomerDTO,
  TCustomer,
  TFetched,
} from "@/types";
import { IoVolumeHigh } from "react-icons/io5";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Textarea } from "@/components/ui/textarea";
import { getCustomers } from "@/lib/api/customers";
import { Input } from "@/components/ui/input";
import { ExternalFunctionData } from "@/components/ui/add-function-dialog";
import { triggermakecall } from "@/lib/api/cron";
import { createCall } from "@/lib/api/campaigns";
import { createCallADP } from "@/lib/api/call";
import { FaRobot } from "react-icons/fa";
import { Label } from "@/components/ui/label";
import DropdownInput from "@/components/inputs/DropdownInput";
import { Header } from "@/components/Typography";
import ShineBorder from "@/components/ui/shine-border";
import { StatusBadge } from "@/components/StatusBadge";

const sttToLanguage: { [key: string]: string } = {
  "hi-IN": "Hindi",
  "en-US": "English",
  "ta-IN": "Tamil",
  "ml-IN": "Malayalam",
  "te-IN": "Telugu",
  "gu-IN": "Gujarati",
  "mr-IN": "Marathi",
  "pa-IN": "Punjabi",
};

export default function AgentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { organisation, loading: userLoading } = useUser();
  const [agent, setAgent] = useState<TFetched<TAgent>>({
    data: undefined,
    loading: true,
  });
  const [customers, setCustomers] = useState<TFetched<TCustomer[]>>({
    loading: true,
    data: undefined,
  });
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [popup, setPopup] = useState<"share" | "embed" | null>(null);
  const [selectedServiceProvider, setSelectedServiceProvider] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [makeCallPhoneNumber, setMakeCallPhoneNumber] = useState("");
  const [showInboundURLDialog, setShowInboundURLDialog] = useState(false);
  const [showMakeCallDialog, setShowMakeCallDialog] = useState(false);
  const shareLink = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL;
  const embedCode = `<iframe
    src="${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/agents/${id}/embed"
    title="chatbot"
    frameBorder="0"
    style={{
      background: "transparent",
      width: "400px",
      height: "700px",
      position: "fixed",
      bottom: "20px",
      right: "20px",
      border: "none",
    }}
    allowTransparency="true"
  ></iframe>`;
  const inboundURL =
    process.env.NEXT_ENVIRONMENT == "DEV"
      ? "http://"
      : "https://" + process.env.NEXT_PUBLIC_API_BASE_URL + "/inbound/" + id;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };
  const handleDelete = async () => {
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
        title: "Agent is being deleted",
        description: "Please wait",
      });
      return;
    }

    setUploading(true);
    try {
      const agent = await deleteAgent(id);

      toast({
        title: "Agent Deleted",
        description: `Agent "${agentData.name}" deleted`,
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error deleting agent",
        description: error.message,
      });
      setIsDialogOpen(false);
    }

    setUploading(false);
    window.location.href = "/agents";
  };

  const makeCall = async (makeCallPhoneNumber: string) => {
    try {
      const currentCustomer = customers?.data?.find(
        (c) => c.phone === makeCallPhoneNumber
      );
      if (!currentCustomer) {
        const toCreate: TCreateCustomerDTO = {
          phone: makeCallPhoneNumber,
          addressLine1: "",
          addressLine2: "",
          organisationId: organisation?.uid || "",
        };

        try {
          const res = await createCustomers([toCreate]);
          console.log("Res");
          console.log(res);

          setCustomers({
            loading: false,
            data: [...(customers.data || []), ...res],
            error: undefined,
          });
        } catch (error) {
          console.error("Failed to create customer:", error);
          throw error;
        }
      }
      const call: TCreateCallADP = {
        organisationId: organisation?.uid || "",
        status: CallStatus.PENDING,
        customerId: "customer_" + organisation?.uid + "_" + makeCallPhoneNumber,
        callType: "OUTBOUND",
        agentId: id,
        fromPhone: phoneNumber,
      };
      setMakeCallPhoneNumber("");
      setShowMakeCallDialog(false);
      (async () => {
        await createCallADP(call);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        triggermakecall();
        toast({
          title: "Call scheduled",
          description: `Call scheduled for ${makeCallPhoneNumber}`,
        });
      })();
    } catch (error: any) {
      console.log(error);
    }
  };

  // Get available service providers
  const getServiceProviders = () => {
    if (!organisation || !organisation.Service_Provider) {
      return [];
    }
    return Object.keys(organisation.Service_Provider);
  };

  // Get phone numbers for a specific service provider
  const getPhoneNumbersForProvider = (provider: string) => {
    if (
      !organisation ||
      !organisation.Service_Provider ||
      !organisation.Service_Provider[provider]
    ) {
      return [];
    }

    // Handle both array of strings and array of objects with name/value properties
    const numbers = organisation.Service_Provider[provider];
    return numbers.map((number: string | any) => {
      // If number is an object with a name property, use that for display
      if (typeof number === "object" && number !== null) {
        const displayName = number.name
          ? `${number.name} (${number})`
          : number.toString();
        return {
          key: typeof number === "string" ? number : number.toString(),
          value: typeof number === "string" ? number : number.toString(),
        };
      } else {
        return {
          key: number.toString(),
          value: number.toString(),
        };
      }
    });
  };

  // Reset phone number when service provider changes
  useEffect(() => {
    setPhoneNumber("");
  }, [selectedServiceProvider]);

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

    const fetchCustomers = async () => {
      if (!organisation) {
        return;
      }

      try {
        const res = await getCustomers(organisation.uid);
        setCustomers({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setCustomers({ loading: false, data: [], error: error.message });
      }
    };

    Promise.all([fetchAgent(), fetchCustomers()]);
  }, [id]);

  // Set first service provider as default when organisation data loads
  useEffect(() => {
    if (organisation) {
      // Debug check to see what's in the organisation object
      console.log("Organisation data:", organisation);

      if (organisation.Service_Provider) {
        console.log(
          "Service providers:",
          Object.keys(organisation.Service_Provider)
        );
        const providers = Object.keys(organisation.Service_Provider);
        if (providers.length > 0) {
          setSelectedServiceProvider(providers[0]);
          console.log("Selected first provider:", providers[0]);

          // Also log phone numbers for debugging
          if (organisation.Service_Provider[providers[0]]) {
            console.log(
              "Phone numbers for provider:",
              organisation.Service_Provider[providers[0]]
            );
          }
        }
      } else {
        console.log("No Service_Provider property found in organisation data");
      }
    }
  }, [organisation]);

  if (userLoading || agent.loading) {
    return <AgentDetailsSkeleton />;
  }

  if (agent.error || !agent.data) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{agent.error || "Agent not found"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { data: agentData } = agent;

  if (agentData.isDeleted) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{"Agent is deleted"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const serviceProviders = getServiceProviders();

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-background to-muted pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <Header className="text-3xl font-bold md:text-3xl mb-3 bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent flex flex-row items-center gap-3">
              <div className="relative">
                <FaRobot className="w-8 h-8 text-orange-500" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              {agentData.name}
            </Header>

            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(agentData.createdAt * 1000).toLocaleString()}
              </span>
              {agentData.isDeleted && <StatusBadge status="Deleted" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" className="shadow-md">
              <Link href={`/agents/${id}/talk`}>
                <IoVolumeHigh className="mr-2 h-4 w-4" />
                Talk to Agent
              </Link>
            </Button>
            <Button
              variant="default"
              className="shadow-md"
              onClick={() => setShowMakeCallDialog(true)}
            >
              <Phone className="mr-2 h-4 w-4" />
              Make Call
            </Button>
            <Button asChild variant="outline" className="shadow-md">
              <Link href={`/agents/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button asChild variant="outline" className="shadow-md">
              <Link href={`/agents/${id}/duplicate`}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Link>
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                className="shadow-md"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="ml-2">More</span>
              </Button>

              {showMenu && (
                <div className="absolute right-0 mt-2 p-2 bg-card border rounded-lg shadow-lg z-50 w-48 animate-in fade-in-50 slide-in-from-top-5">
                  <Button
                    variant="ghost"
                    className="w-full justify-start mb-1"
                    onClick={() => {
                      setShowShareDialog(true);
                      setShowMenu(false);
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    className="w-full justify-start mb-1"
                    variant="ghost"
                    onClick={() => {
                      setShowEmbedDialog(true);
                      setShowMenu(false);
                    }}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Embed
                  </Button>
                  <Button
                    className="w-full justify-start mb-1"
                    variant="ghost"
                    onClick={() => {
                      setShowInboundURLDialog(true);
                      setShowMenu(false);
                    }}
                  >
                    <Webhook className="mr-2 h-4 w-4" />
                    Inbound URL
                  </Button>
                  <hr className="my-2 border-border" />
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsDialogOpen(true);
                      setShowMenu(false);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Agent
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Info Card */}

        <Card className="  w-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Agent Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            <InfoCard
              icon={<Languages className="text-primary" />}
              title="Language"
              value={sttToLanguage[agentData.sttLanguageId]}
            />
            {agentData.fillerWords && (
              <InfoCard
                icon={<WholeWord className="text-primary" />}
                title="Filler Words"
                value={agentData.fillerWords}
              />
            )}
            <InfoCard
              icon={<Volume2 className="text-primary" />}
              title="STT Type"
              value={agentData.sttType}
            />
            <InfoCard
              icon={<Text className="text-primary" />}
              title="TTS Type"
              value={agentData.ttsType}
            />
            <InfoCard
              icon={<FaRobot className="text-primary" />}
              title="Model ID"
              value={agentData.modelId}
            />
            <InfoCard
              icon={<Brain className="text-primary" />}
              title="LLM Type"
              value={agentData.llmType}
            />
          </CardContent>
        </Card>

        <Card className={`w-full`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    System Prompt
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 pl-14">
                  {agentData.promptTemplate}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30">
                    <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Initial Message
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 pl-14">
                  {agentData.initialMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`w-full `}>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Agent Config
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* End Call */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30">
                  <PhoneOff className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    End Call
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {agentData.actions.endCall ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>

              {/* Transfer Call */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Transfer Call
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {agentData.actions.transferCall.transferCall
                      ? "Active"
                      : "Inactive"}
                  </div>
                  {agentData.actions.transferCall.phone && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
                      {agentData.actions.transferCall.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Ignore Utterance */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Mic className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Ignore Utterance
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {agentData.ignoreUtterance ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              {/* Background Noise */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Wind className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Background Noise
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {agentData.bgNoise ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>

              {/* Max Call Duration */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30">
                  <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Max Call Duration
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {agentData.maxCallDuration} seconds
                  </div>
                </div>
              </div>

              {/* Idle Timeout */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Idle Timeout
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {agentData.idleTimeout} seconds
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {agentData.fields && agentData.fields.length > 0 && (
          <Card className="border border-border shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Input Fields
              </CardTitle>
              <CardDescription>
                Fields that can be provided to the agent during conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {agentData.fields.map((field) => (
                <div
                  key={field.name}
                  className="bg-accent/50 border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                >
                  <h3 className="font-medium text-foreground">
                    {toCapitalizedSentence(field.name)}
                  </h3>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {agentData.extractionFields &&
          agentData.extractionFields.length > 0 && (
            <ShineBorder className="rounded-xl w-full">
              <Card className="border-0 shadow-none bg-transparent w-full">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Extraction Fields
                  </CardTitle>
                  <CardDescription>
                    Information that the agent will extract during conversations
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {agentData.extractionFields.map((field, index) => (
                    <div
                      key={field.name}
                      className="bg-gradient-to-br from-accent/50 to-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {toCapitalizedSentence(field.name)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </ShineBorder>
          )}

        {agentData.actions &&
          agentData.actions.externalFunctions &&
          agentData.actions.externalFunctions.length > 0 && (
            <Card className="border border-border shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  External Functions
                </CardTitle>
                <CardDescription>
                  External APIs that the agent can call during conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {agentData.actions.externalFunctions.map((func) => {
                  return (
                    <ExternalFunctionCard func={func} key={func.functionName} />
                  );
                })}
              </CardContent>
            </Card>
          )}
      </div>

      {/* Dialogs */}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
        message={`Are you sure you want to delete the agent "${agent.data.name}"?`}
      />

      <Dialog open={showMakeCallDialog} onOpenChange={setShowMakeCallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Make Call
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Service Provider Selection - Always Show */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Select Service Provider
              </Label>
              {organisation &&
              serviceProviders &&
              serviceProviders.length > 0 ? (
                <DropdownInput
                  options={serviceProviders.map((provider) => ({
                    key: provider,
                    value: provider,
                  }))}
                  selected={selectedServiceProvider}
                  setSelected={(value) =>
                    setSelectedServiceProvider(value || "")
                  }
                />
              ) : (
                <div className="text-sm text-muted-foreground p-2 border border-border rounded-md">
                  No service providers available
                </div>
              )}
            </div>

            {/* Phone Number Selection (only shown if service provider is selected) */}
            {selectedServiceProvider && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Select Calling Number
                </Label>
                {getPhoneNumbersForProvider(selectedServiceProvider).length >
                0 ? (
                  <DropdownInput
                    options={getPhoneNumbersForProvider(
                      selectedServiceProvider
                    )}
                    selected={phoneNumber}
                    setSelected={(value) => setPhoneNumber(value || "")}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground p-2 border border-border rounded-md">
                    No phone numbers available for this provider
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Enter Phone Number to Call
              </Label>
              <Input
                type="tel"
                maxLength={10}
                placeholder="Enter phone number"
                value={makeCallPhoneNumber}
                onChange={(e) => {
                  if (!isNaN(Number(e.target.value))) {
                    setMakeCallPhoneNumber(e.target.value);
                  }
                }}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => makeCall(makeCallPhoneNumber)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!phoneNumber || !makeCallPhoneNumber}
            >
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Share Agent
            </DialogTitle>
          </DialogHeader>
          <div className="bg-black text-white font-mono rounded-lg p-4 overflow-auto text-sm border border-gray-700">
            <pre className="whitespace-pre-wrap">
              {shareLink + "/agents/" + id + "/talk"}
            </pre>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() =>
                copyToClipboard(shareLink + "/agents/" + id + "/talk")
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Embed Agent
            </DialogTitle>
          </DialogHeader>
          <div className="bg-black text-white font-mono rounded-lg p-4 overflow-auto text-sm border border-gray-700">
            <pre className="whitespace-pre-wrap">{embedCode}</pre>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => copyToClipboard(embedCode)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showInboundURLDialog}
        onOpenChange={setShowInboundURLDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Inbound URL
            </DialogTitle>
          </DialogHeader>
          <div className="bg-black text-white font-mono rounded-lg p-4 overflow-auto text-sm border border-gray-700">
            <pre className="whitespace-pre-wrap">{inboundURL}</pre>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => copyToClipboard(inboundURL)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AgentDetailsSkeleton() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-background to-muted pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <Skeleton className="h-10 w-64 mb-3" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExternalFunctionCard({ func }: { func: ExternalFunctionData }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex flex-row cursor-pointer justify-between items-center py-4"
      >
        <div className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {func.functionName}
          </h3>
        </div>

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {isCollapsed ? "+" : "-"}
        </Button>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="pt-0 pb-5 space-y-5">
          <p className="text-muted-foreground">{func.description}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                API URL
              </h4>
              <p className="text-foreground font-mono text-sm bg-accent/50 p-2 rounded-md">
                {func.apiUrl}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Method
              </h4>
              <p className="text-foreground font-medium">
                <Badge variant="outline" className="font-mono">
                  {func.method}
                </Badge>
              </p>
            </div>
          </div>

          {/* Headers */}
          {func.headers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Headers
              </h4>
              <div className="bg-accent/30 rounded-lg p-3 border border-border">
                <ul className="space-y-2">
                  {func.headers.map((header, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {header.key}:
                      </span>
                      <span className="ml-2 font-mono text-sm text-muted-foreground">
                        {header.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Query Parameters */}
          {func.queryParams.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Query Parameters
              </h4>
              <div className="bg-accent/30 rounded-lg p-3 border border-border">
                <ul className="space-y-3">
                  {func.queryParams.map((param, idx) => (
                    <li key={idx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {param.param}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {param.type}
                        </Badge>
                        {param.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground pl-4">
                        {param.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Speak on Send
              </h4>
              <Badge variant={func.speak_on_send ? "default" : "outline"}>
                {func.speak_on_send ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Speak on Receive
              </h4>
              <Badge variant={func.speak_on_receive ? "default" : "outline"}>
                {func.speak_on_receive ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
