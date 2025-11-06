"use client";

import CallStatusDisplay from "@/components/CallStatusDisplay";
import Loading from "@/components/Loading";
import { Header } from "@/components/Typography";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useUser from "@/hooks/useUser";
import {
  getCallsBetween,
  getCallsByAgent,
  getDocumentsByIdPart,
  getOtherCallsAfter,
  getPendingCallsAfter,
} from "@/lib/api/call";
import { TAgent, TCall, TCustomer, TFetched } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";
import { toast } from "@/components/ui/use-toast";
import {
  CalendarIcon,
  SearchIcon,
  XCircleIcon,
  PhoneCallIcon,
  PhoneIcon,
  ChevronDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAgents } from "@/lib/api/agents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CallsTable = ({ calls }: { calls: TFetched<TCall[]> }) => {
  if (calls.loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (calls.error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-destructive">
        <div className="flex items-center gap-2">
          <XCircleIcon className="w-5 h-5" />
          {calls.error}
        </div>
      </div>
    );
  }

  if (!calls.data || calls.data.length <= 0) {
    return (
      <div className=" flex flex-col items-center justify-center text-muted-foreground">
        <PhoneIcon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Calls Found</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-border/50 overflow-hidden backdrop-blur-sm bg-gradient-to-br from-card/50 to-muted/30">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/70 transition-colors">
            <TableHead className="font-semibold">To</TableHead>
            <TableHead className="font-semibold">Created At</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Duration</TableHead>
            <TableHead className="font-semibold">Campaign</TableHead>
            <TableHead className="font-semibold">Call Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.data.map((call) => (
            <TableRow
              key={call.uid}
              className="group hover:bg-primary/5 transition-colors duration-300"
            >
              <TableCell className="font-medium">
                <Link
                  href={`/calls/${call.uid}`}
                  className="hover:text-primary transition-colors"
                >
                  {call.customerId.split("_")[2]}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {call.createdAt
                  ? new Date(call.createdAt * 1000).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "-"}
              </TableCell>
              <TableCell>
                <CallStatusDisplay status={call.status} />
              </TableCell>
              <TableCell className="font-medium">
                {call.duration ? `${Math.round(call.duration)}s` : "-"}
              </TableCell>
              <TableCell>
                {call.campaignId ? (
                  <Link
                    href={`/campaigns/${call.campaignId}`}
                    className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                  >
                    View Campaign
                  </Link>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5">
                  <PhoneCallIcon className="w-4 h-4 text-muted-foreground" />
                  {call.callType ?? "OUTBOUND"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

function Page() {
  const { organisation } = useUser();
  const limit = 10;
  const [filteredCalls, setFilteredCalls] = useState<TFetched<TCall[]>>({
    loading: true,
    data: [],
  });
  const [search, setSearch] = useState<string>("");
  const [pendingCalls, setPendingCalls] = useState<TFetched<TCall[]>>({
    loading: true,
    data: [],
  });
  const [loadingMorePending, setLoadingMorePending] = useState<boolean>(false);
  const [lastPendingCall, setLastPendingCall] = useState<any | null>(null);
  const [finishedPending, setFinishedPending] = useState<boolean>(false);
  const [otherCalls, setOtherCalls] = useState<TFetched<TCall[]>>({
    loading: true,
    data: [],
  });
  const [filterByDate, setFilterByDate] = useState<boolean>(false);
  const [lastOtherCall, setLastOtherCall] = useState<any | null>(null);
  const [loadingMoreOther, setLoadingMoreOther] = useState<boolean>(false);
  const [finishedOther, setFinishedOther] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [agents, setAgents] = useState<TFetched<TAgent[]>>({
    loading: true,
    data: undefined,
  });
  const [selectedAgent, setSelectedAgent] = useState<TAgent | null>(null);
  useEffect(() => {
    const fetchAgents = async () => {
      if (!organisation) return;
      try {
        const res = await getAgents(organisation.uid, 100);
        setAgents({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setAgents({ loading: false, data: [], error: error.message });
      }
    };

    fetchAgents();
  }, [organisation]);

  useEffect(() => {
    const fetchCalls = async () => {
      if (!organisation) return;

      setPendingCalls({ loading: true, data: undefined });
      try {
        const data = await getPendingCallsAfter(
          organisation.uid,
          limit,
          lastPendingCall
        );

        if (data.calls.length > 0) {
          setLastPendingCall(data.lastVisibleDoc);
        }
        if (data.calls.length < limit) {
          setFinishedPending(true);
        }
        setPendingCalls({ loading: false, data: data.calls, error: undefined });
      } catch (error: any) {
        setPendingCalls({ loading: false, data: [], error: error.message });
      }

      setOtherCalls({ loading: true, data: undefined });
      try {
        const data = await getOtherCallsAfter(
          organisation.uid,
          limit,
          "PENDING",
          lastOtherCall
        );
        if (data.calls.length > 0) {
          setLastOtherCall(data.lastVisibleDoc);
        }
        if (data.calls.length < limit) {
          setFinishedOther(true);
        }
        setOtherCalls({ loading: false, data: data.calls, error: undefined });
      } catch (error: any) {
        setOtherCalls({ loading: false, data: [], error: error.message });
      }
    };

    fetchCalls();
  }, [organisation]);

  useEffect(() => {
    const fetchFilteredCalls = async () => {
      if (debouncedSearch && organisation) {
        setFilteredCalls({ loading: true, data: undefined });
        try {
          const data = await getDocumentsByIdPart<TCall>(
            "calls",
            debouncedSearch,
            "customerId",
            organisation.uid
          );

          setFilteredCalls({ loading: false, data: data, error: undefined });
        } catch (error: any) {
          setFilteredCalls({ loading: false, data: [], error: error.message });
        }
      }
    };

    fetchFilteredCalls();
  }, [debouncedSearch, organisation]);

  const filterCallsByDate = async () => {
    if (!startDate || !endDate || !organisation) {
      toast({
        title: "Invalid Date Range",
        description: "Please enter both start and end dates",
        variant: "destructive",
      });
      return;
    }

    try {
      setFilterByDate(true);
      setFilteredCalls({ loading: true, data: undefined });
      const data = await getCallsBetween(
        organisation.uid,
        new Date(startDate),
        new Date(endDate)
      );

      setFilteredCalls({ loading: false, data: data, error: undefined });
    } catch (error: any) {
      setFilteredCalls({ loading: false, data: [], error: error.message });
    }
  };

  const loadMorePendingCalls = async () => {
    if (organisation && lastPendingCall) {
      setLoadingMorePending(true);
      try {
        const data = await getPendingCallsAfter(
          organisation.uid,
          limit,
          lastPendingCall
        );

        if (data.calls.length > 0) {
          setLastPendingCall(data.lastVisibleDoc);
        } else {
          setFinishedPending(true);
        }
        if (data.calls.length < limit) {
          setFinishedPending(true);
        }
        setPendingCalls((prev) => ({
          loading: false,
          data: [...(prev.data ?? []), ...data.calls],
          error: undefined,
        }));
      } catch (error: any) {
        setPendingCalls({ loading: false, data: [], error: error.message });
      }
      setLoadingMorePending(false);
    }
  };

  const loadMoreOtherCalls = async () => {
    if (organisation && lastOtherCall) {
      setLoadingMoreOther(true);
      try {
        const data = await getOtherCallsAfter(
          organisation.uid,
          limit,
          "PENDING",
          lastOtherCall
        );

        if (data.calls.length > 0) {
          setLastOtherCall(data.lastVisibleDoc);
        } else {
          setFinishedOther(true);
        }
        if (data.calls.length < limit) {
          setFinishedOther(true);
        }
        setOtherCalls((prev) => ({
          loading: false,
          data: [...(prev.data ?? []), ...data.calls],
          error: undefined,
        }));
      } catch (error: any) {
        setOtherCalls({ loading: false, data: [], error: error.message });
      }
      setLoadingMoreOther(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const calls = await getCallsByAgent(selectedAgent?.uid ?? "");
      console.log(calls);

      if (!calls || !Array.isArray(calls)) {
        console.log("No call data to export");
        return;
      }

      const dataToExport = calls.map((call: TCall) => {
        return {
          Number: call.customerId.split("_").pop(),
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

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Calls");
      XLSX.writeFile(workbook, `${selectedAgent?.name ?? "calls"}.xlsx`);
      console.log(`Exported data to ${selectedAgent?.name ?? "calls"}.xlsx`);
    } catch (error: any) {
      console.error("Export failed:", error.message);
    }
  };

  const resetFilterDate = () => {
    setFilterByDate(false);
    setStartDate("");
    setEndDate("");
    setFilteredCalls({ loading: true, data: [] });
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-fade-in">
          <Header className="text-3xl font-bold md:text-3xl mb-4 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Your Calls
          </Header>
          <p className="text-base text-muted-foreground leading-relaxed">
            Track and manage all your customer communications
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="relative">
              {/* <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /> */}
              <Input
                placeholder="Search calls by customer ID..."
                className="bg-card/50 backdrop-blur-sm"
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />
            </div>

            <div className="grid md:flex gap-4">
              <div className="relative flex-1">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  className="bg-card/50 backdrop-blur-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.currentTarget.value)}
                />
              </div>
              <div className="relative flex-1">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  className="bg-card/50 backdrop-blur-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.currentTarget.value)}
                />
              </div>
              <Button
                onClick={filterCallsByDate}
                className="bg-primary/90 hover:bg-primary transition-colors"
              >
                Filter
              </Button>
              {filterByDate && (
                <Button
                  onClick={resetFilterDate}
                  variant="outline"
                  className="h-12 px-6"
                >
                  Reset
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {selectedAgent?.name || "Select Agent"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {agents.data?.map((agent) => (
                    <DropdownMenuItem
                      key={agent.uid}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      {agent.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-primary transition-colors"
                disabled={selectedAgent === null}
              >
                Export to Excel
              </Button>
            </div>
          </div>

          {debouncedSearch !== "" || filterByDate ? (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-semibold">Search Results</h2>
              <CallsTable calls={filteredCalls} />
            </div>
          ) : (
            <div className="space-y-12 animate-fade-in">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Pending Calls
                </h2>
                <CallsTable calls={pendingCalls} />
                {!finishedPending && (
                  <div className="flex justify-center">
                    <Button
                      onClick={loadMorePendingCalls}
                      disabled={loadingMorePending}
                      variant="outline"
                      className="group"
                    >
                      {loadingMorePending ? (
                        <span className="flex items-center gap-2">
                          <Loading className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Load More
                          <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Other Calls</h2>
                <CallsTable calls={otherCalls} />
                {!finishedOther && loadingMoreOther ? (
                  <Loading className="w-4 h-4" />
                ) : (
                  <div className="flex justify-center">
                    <Button
                      onClick={loadMoreOtherCalls}
                      disabled={loadingMoreOther}
                      variant="outline"
                      className="group"
                    >
                      {
                        <span className="flex items-center gap-2">
                          Load More
                          <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                        </span>
                      }
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Page;
