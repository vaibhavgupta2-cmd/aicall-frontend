"use client";
import CallStatusDisplay from "@/components/CallStatusDisplay";
import Loading from "@/components/Loading";
import { Header } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import useUser from "@/hooks/useUser";
import { getAgent } from "@/lib/api/agents";
import { getCallsInCampaign, getCampaign } from "@/lib/api/campaigns";
import { getCustomers } from "@/lib/api/customers";
import { toCapitalizedSentence } from "@/lib/utils";
import {
  CallStatus,
  TAgent,
  TCall,
  TCampaign,
  TCustomer,
  TFetched,
} from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import getDocumentsByIds from "@/lib/firebase/getDocuments";
import getDocumentsCountByIds from "@/lib/firebase/getDocumentCount";
import { retryFailedCalls } from "@/lib/api/cron";
import { log } from "console";
import { Pause, Play } from "lucide-react";

function Page() {
  const { id } = useParams<{ id: string }>();

  const { organisation, loading } = useUser();

  const [campaign, setCampaign] = useState<TFetched<TCampaign>>({
    data: undefined,
    loading: true,
  });

  const [agent, setAgent] = useState<TFetched<TAgent>>({
    data: undefined,
    loading: true,
  });

  const [customers, setCustomers] = useState<TFetched<TCustomer[]>>({
    data: undefined,
    loading: true,
  });

  const [calls, setCalls] = useState<TFetched<TCall[]>>({
    data: undefined,
    loading: true,
  });
  const [callIdIndex, setCallIdIndex] = useState(0);
  const itemsPerPage = 10;
  const [callsFinished, setCallsFinished] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [completedCalls, setCompletedCalls] = useState(0);
  const [pendingCalls, setPendingCalls] = useState(0);
  const { toast } = useToast();

  const [playingUid, setPlayingUid] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate the authenticated proxy URL for the recording
  const getAuthenticatedRecordingUrl = (recordUrl: string) => {
    // Encode the original Exotel URL to pass it to our proxy
    const encodedUrl = encodeURIComponent(recordUrl);
    return `/api/recording-proxy?url=${encodedUrl}`;
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) {
        return;
      }

      try {
        const res = await getCampaign(id);
        setCampaign({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setCampaign({ loading: false, data: undefined, error: error.message });
      }
    };
    fetchCampaign();
  }, [id]);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!organisation) {
        return;
      }

      try {
        const res = await getCustomers(organisation.uid);
        setCustomers({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setCustomers({ loading: false, data: undefined, error: error.message });
        toast({
          title: "Error fetching campaign",
          description: error.message,
        });
      }
    };

    fetchCustomers();
  }, [organisation, toast]);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!campaign.data) {
        return;
      }

      try {
        const res = await getAgent(campaign.data.agentId);
        setAgent({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setAgent({ loading: false, data: undefined, error: error.message });
        toast({
          title: "Error fetching campaign",
          description: error.message,
        });
      }
    };

    const fetchCalls = async () => {
      if (!campaign.data) {
        return;
      }

      try {
        let callIds: string[] = campaign.data.callIds;

        const res = await getCallsInCampaign({
          callIds: callIds.slice(0, Math.min(callIds.length, itemsPerPage)),
        });
        setCallIdIndex(Math.min(callIds.length, itemsPerPage));
        setCalls({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setCalls({ loading: false, data: undefined, error: error.message });
        toast({
          title: "Error fetching campaign",
          description: error.message,
        });
      }
    };

    const fetchCompletedAndPendingCalls = async () => {
      if (!campaign.data) {
        return;
      }
      try {
        const res = getDocumentsCountByIds("calls", campaign.data.callIds);
        setCompletedCalls((await res).completed);
        setPendingCalls((await res).pending);
      } catch (error: any) {
        setCompletedCalls(0);
        setPendingCalls(0);
        toast({
          title: "Error fetching campaign",
          description: error.message,
        });
      }
    };

    Promise.all([fetchAgent(), fetchCalls(), fetchCompletedAndPendingCalls()]);
  }, [campaign.data, toast]);

  const onGetExportProduct = async (
    title?: string,
    worksheetname?: string,
    calls?: any
  ) => {
    try {
      if (calls && Array.isArray(calls)) {
        const dataToExport = calls.map((call: any) => {
          return {
            Number: customers.data?.find((c: any) => c.uid === call.customerId)
              ?.phone,
            Status: call.status,
            Duration: call.duration ? `${Math.round(call.duration)}s` : "-",
            RecordingURL: call.record_url,
            ...call.extractionFieldsValues?.reduce((acc: any, field: any) => {
              return {
                ...acc,
                [field.name]: field.value,
              };
            }, {}),
          };
        });

        console.log(dataToExport);

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils?.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(workbook, worksheet, worksheetname);
        XLSX.writeFile(workbook, `${title}.xlsx`);
        console.log(`Exported data to ${title}.xlsx`);
      } else {
        console.log("#==================Export Error");
      }
    } catch (error: any) {
      console.log("#==================Export Error", error.message);
    }
  };

  const loadMoreCalls = async () => {
    if (!campaign.data) {
      return;
    }

    setLoadingMore(true);
    try {
      let callIds: string[] = campaign.data.callIds;

      const res = await getCallsInCampaign({
        callIds: callIds.slice(
          callIdIndex,
          Math.min(callIds.length, callIdIndex + itemsPerPage)
        ),
      });
      setCallIdIndex(Math.min(callIds.length, callIdIndex + itemsPerPage));

      setCalls({
        loading: false,
        data: calls.data?.concat(res) ?? res,
        error: undefined,
      });

      if (callIdIndex + itemsPerPage >= callIds.length) {
        setCallsFinished(true);
      }
    } catch (error: any) {
      setCalls({ loading: false, data: undefined, error: error.message });
      toast({
        title: "Error fetching campaign",
        description: error.message,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const retryCalls = async () => {
    if (!id) {
      return;
    }

    try {
      const res = await retryFailedCalls(id, 0);
      console.log("res", res);
      toast({
        title: "Calls retried successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error retrying calls",
        description: error.message,
      });
    }
  };

  const handleAudioPlay = (call: TCall, e: React.MouseEvent) => {
    e.stopPropagation();

    // If the same call is playing, pause it
    if (playingUid === call.uid) {
      audioRef.current?.pause();
      setPlayingUid(null);
      return;
    }

    // Stop previous audio if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create new audio with authenticated URL and play
    if (!call.record_url) {
      toast({
        title: "Audio Error",
        description: "Recording URL is missing",
        variant: "destructive"
      });
      return;
    }
    const authenticatedUrl: string = getAuthenticatedRecordingUrl(call.record_url);
    const audio = new Audio(authenticatedUrl);
    audioRef.current = audio;
    setPlayingUid(call.uid);
    
    audio.play().catch((error) => {
      console.error('Error playing audio:', error);
      toast({
        title: "Audio Error",
        description: "Failed to play the recording",
        variant: "destructive"
      });
      setPlayingUid(null);
    });

    // Reset when audio ends
    audio.onended = () => {
      setPlayingUid(null);
    };

    // Handle audio errors
    audio.onerror = () => {
      console.error('Audio loading error');
      toast({
        title: "Audio Error",
        description: "Failed to load the recording",
        variant: "destructive"
      });
      setPlayingUid(null);
    };
  };

  if (loading || campaign.loading) {
    return <Loading />;
  }

  if (campaign.error) {
    return <div>{campaign.error}</div>;
  }

  if (!campaign.data) {
    return <div>Campaign not found</div>;
  }

  return (
    <div>
      <div className="flex flex-row items-baseline justify-between">
        <Header>{campaign.data.name}</Header>
        <div>
          <Button onClick={retryCalls} className="m-auto mr-3">
            Retry Calls
          </Button>
          <Button
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-md"
            onClick={() => {
              onGetExportProduct(
                campaign.data?.name,
                campaign.data?.name,
                calls.data
              );
            }}
          >
            Export to Excel
          </Button>
        </div>
      </div>

      <div className="gap-4 mt-4">
        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <Card className="child:p-4">
            <CardHeader className="!pb-0 font-medium">
              Agent Selected
            </CardHeader>
            <CardContent className="!pt-0">{agent.data?.name}</CardContent>
          </Card>
          <Card className="child:p-4">
            <CardHeader className="!pb-0 font-medium">Created at</CardHeader>
            <CardContent className="!pt-0">
              {new Date(campaign.data.createdAt).toLocaleString()}
            </CardContent>
          </Card>
          <Card className="child:p-4">
            <CardHeader className="!pb-0 font-medium">Status</CardHeader>
            <CardContent className="!pt-0">
              {campaign.data.status}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <Card className="child:p-4">
            <CardHeader className="!pb-0 font-medium">Total Calls</CardHeader>
            <CardContent className="!pt-0">
              {campaign.data.callIds.length}
            </CardContent>
          </Card>
          <Card className="child:p-4">
            <CardHeader className="!pb-0 font-medium">
              Completed Calls
            </CardHeader>
            <CardContent className="!pt-0">{completedCalls}</CardContent>
          </Card>
          <Card className="child:p-4">
            <CardHeader className="!pb-0 font-medium">Pending Calls</CardHeader>
            <CardContent className="!pt-0">{pendingCalls}</CardContent>
          </Card>
          <Card className="child:p-4">
            <CardHeader className="!pb-0 font-medium">Skipped Calls</CardHeader>
            <CardContent className="!pt-0">{campaign.data.totalSkippedRecords}</CardContent>
          </Card>
        </div>
      </div>

      {calls && (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Recording</TableHead>
              {agent.data &&
                agent.data.extractionFields.map((field) => (
                  <TableHead key={field.name}>
                    {toCapitalizedSentence(field.name)}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.data?.map((call) => (
              <Link key={call.uid} href={`/calls/${call.uid}`} legacyBehavior>
                <TableRow className="hover:cursor-pointer">
                  <TableCell>
                    {
                      customers.data?.find((c) => c.uid === call.customerId)
                        ?.phone
                    }
                  </TableCell>
                  <TableCell>
                    <CallStatusDisplay status={call.status} />
                  </TableCell>
                  <TableCell>
                    {call.duration ? `${Math.round(call.duration)}s` : "-"}
                  </TableCell>
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    {call.record_url ? (
                      <button
                        onClick={(e) => handleAudioPlay(call, e)}
                        className="p-1 hover:text-primary transition-colors"
                        title={playingUid === call.uid ? "Pause recording" : "Play recording"}
                      >
                        {playingUid === call.uid ? (
                          <Pause size={20} />
                        ) : (
                          <Play size={20} />
                        )}
                      </button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  {agent.data?.extractionFields.map((x) => (
                    <TableCell key={x.name}>
                      {toCapitalizedSentence(
                        call.extractionFieldsValues
                          ?.find((y) => y.name === x.name)
                          ?.value.toString() || "-"
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </Link>
            ))}
          </TableBody>
        </Table>
      )}
      {callsFinished ? null : (
        <div className="flex justify-center my-4">
          <Button
            onClick={loadMoreCalls}
            disabled={loadingMore}
            className="m-auto"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default Page;