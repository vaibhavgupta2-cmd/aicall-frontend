"use client";

import Loading from "@/components/Loading";
import { Header } from "@/components/Typography";
import ProtectedRoute from "@/components/routes/ProtectedRoute";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import useUser from "@/hooks/useUser";
import { getAgents } from "@/lib/api/agents";
import { getCampaigns } from "@/lib/api/campaigns";
import { cn } from "@/lib/utils";
import { TAgent, TCall, TCampaign, TFetched } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoAddCircleOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import {
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { getCalls, getCallsBetween } from "@/lib/api/call";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LinearScale,
  CategoryScale,
  BarElement,
} from "chart.js";
import DropdownInput from "@/components/inputs/DropdownInput";
import RetroGrid from "@/components/ui/retro-grid";
import GradualSpacing from "@/components/ui/gradual-spacing";
import WordFadeIn from "@/components/ui/word-fade-in";

// Register chart components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LinearScale,
  CategoryScale,
  BarElement
);

function Page() {
  const { user, organisation } = useUser();

  const [collapse, setCollapse] = useState(true);
  const [agents, setAgents] = useState<TFetched<TAgent[]>>({
    loading: true,
    data: undefined,
  });

  const [campaigns, setCampaigns] = useState<TFetched<TCampaign[]>>({
    loading: true,
    data: undefined,
  });

  const [calls, setCalls] = useState<TFetched<TCall[]>>({
    loading: true,
    data: undefined,
  });

  const [topAgents, setTopAgents] = useState<
    { agentName: string; callCount: number; uid: string }[]
  >([]);

  const [agentsMap, setAgentsMap] = useState<Record<string, string>>({});

  const [timeRange, setTimeRange] = useState("last7");

  useEffect(() => {
    const fetchData = async () => {
      if (!organisation) return;

      try {
        const [agentsRes, campaignsRes, callsRes] = await Promise.all([
          getAgents(organisation.uid),
          getCampaigns(organisation.uid, 3),
          getCallsBetween(
            organisation.uid,
            new Date(new Date().setDate(new Date().getDate() - 7)),
            new Date()
          ),
        ]);
        const agentsMap = agentsRes.reduce((acc, agent) => {
          acc[agent.uid] = agent.name;
          return acc;
        }, {} as Record<string, string>);
        const callsByAgent = callsRes.reduce((acc, call) => {
          if (!acc[call.agentId]) {
            acc[call.agentId] = { callCount: 0 };
          }
          acc[call.agentId].callCount++;
          return acc;
        }, {} as Record<string, { callCount: number }>);

        // Convert object to array, map agentId to agentName, and sort by call count
        const topAgents = Object.keys(callsByAgent)
          .map((agentId) => ({
            agentId,
            agentName: agentsMap[agentId] || "Unknown", // Use the agent name mapping
            callCount: callsByAgent[agentId].callCount,
            uid: agentId,
          }))
          .sort((a, b) => b.callCount - a.callCount)
          .slice(0, 3); // Get top 3 agents

        setTopAgents(topAgents);
        setAgentsMap(agentsMap);
        setAgents({ loading: false, data: agentsRes, error: undefined });
        setCampaigns({ loading: false, data: campaignsRes, error: undefined });
        setCalls({ loading: false, data: callsRes, error: undefined });
      } catch (error: any) {
        setAgents({ loading: false, data: [], error: error.message });
        setCampaigns({ loading: false, data: [], error: error.message });
        setCalls({ loading: false, data: [], error: error.message });
      }
    };

    fetchData();
  }, [organisation]);

  useEffect(() => {
    setCalls({ loading: true, data: undefined, error: undefined });
    if (!agents.data) return;
    const agentsMap = agents.data?.reduce((acc, agent) => {
      acc[agent.uid] = agent.name;
      return acc;
    }, {} as Record<string, string>);
    setAgentsMap(agentsMap);
    const fetchCalls = async () => {
      if (!organisation) {
        return;
      }
      let res: TCall[] = [];
      try {
        if (timeRange === "today") {
          res = await getCallsBetween(organisation.uid, new Date(), new Date());
        } else if (timeRange === "last7") {
          res = await getCallsBetween(
            organisation.uid,
            new Date(new Date().setDate(new Date().getDate() - 7)),
            new Date()
          );
        } else if (timeRange === "last30") {
          res = await getCallsBetween(
            organisation.uid,
            new Date(new Date().setDate(new Date().getDate() - 30)),
            new Date()
          );
        } else if (timeRange === "thisMonth") {
          res = await getCallsBetween(
            organisation.uid,
            new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            new Date()
          );
        } else if (timeRange === "last3Months") {
          res = await getCallsBetween(
            organisation.uid,
            new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
            new Date()
          );
        }
        const callsByAgent = res.reduce((acc, call) => {
          if (!acc[call.agentId]) {
            acc[call.agentId] = { callCount: 0 };
          }
          acc[call.agentId].callCount++;
          return acc;
        }, {} as Record<string, { callCount: number }>);

        // Convert object to array, map agentId to agentName, and sort by call count
        const topAgents = Object.keys(callsByAgent)
          .map((agentId) => ({
            agentId,
            agentName: agentsMap[agentId] || "Unknown", // Use the agent name mapping
            callCount: callsByAgent[agentId].callCount,
            uid: agentId,
          }))
          .sort((a, b) => b.callCount - a.callCount)
          .slice(0, 3); // Get top 3 agents

        setCalls({ loading: false, data: res, error: undefined });
        setTopAgents(topAgents);
      } catch (error: any) {
        setCalls({ loading: false, data: [], error: error.message });
      }
    };
    fetchCalls();
  }, [timeRange]);

  const [canSeeAPIKey, setCanSeeAPIKey] = useState(false);

  if (!user || !organisation) {
    return <Loading />;
  }

  // Data for the charts
  const callData = calls.data || [];
  const completedCalls = callData.filter(
    (call) => call.status === "COMPLETED"
  ).length;
  const failedCalls = callData.filter(
    (call) => call.status === "FAILED"
  ).length;
  const pendingCalls = callData.filter(
    (call) => call.status === "PENDING"
  ).length;
  const avgCallDuration =
    callData.length > 0
      ? Math.round(
          callData.reduce(
            (acc, call) =>
              acc + (call.duration === undefined ? 0 : call.duration),
            0
          ) /
            (callData.length * 60)
        )
      : 0;

  // Data for Pie Chart
  const pieData = {
    labels: ["Failed Calls", "Completed Calls", "Pending Calls"],
    datasets: [
      {
        label: "",
        data: [failedCalls, completedCalls, pendingCalls],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)", // Failed Calls - Red with transparency
          "rgba(34, 197, 94, 0.8)", // Completed Calls - Green with transparency
          "rgba(234, 179, 8, 0.8)", // Pending Calls - Yellow with transparency
        ],
        barThickness: 20,
        maxBarThickness: 30,
        categoryPercentage: 0.2,
        barPercentage: 0.3,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  // Data for Bar Graph
  const barData = {
    labels: topAgents.map((agent) => agent.agentName), // Agent names
    datasets: [
      {
        label: "Number of Calls",
        data: topAgents.map((agent) => agent.callCount), // Call counts for each agent
        backgroundColor: "rgba(99, 102, 241, 0.8)", // Indigo with transparency
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2,
        barThickness: 30,
        maxBarThickness: 30,
        categoryPercentage: 0.5,
        barPercentage: 0.7,
      },
    ],
  };

  const barOptions = {
    indexAxis: "x" as const,
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Monthly Sales Data",
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <>
      <div className="mt-8 flex items-center justify-between">
        <WordFadeIn words="Your Calls" className="text-xl md:text-2xl" />
        <div>
          <DropdownInput
            selected={timeRange}
            options={[
              { value: "Today", key: "today" },
              { value: "Last 7 days", key: "last7" },
              { value: "Last 30 days", key: "last30" },
              { value: "This month", key: "thisMonth" },
              { value: "Last 3 Months", key: "last3Months" },
            ]}
            setSelected={(e) => {
              if (!e) {
                return;
              }
              setTimeRange(e);
            }}
          />
        </div>
      </div>

      <div className="relative flex w-full mt-6 items-center justify-center overflow-hidden rounded-2xl border bg-white/30 dark:bg-black/30 backdrop-blur-xl p-14 shadow-lg">
        <div className="mx-auto">
          {calls.loading ? (
            <Loading />
          ) : calls.error ? (
            <p>{calls.error}</p>
          ) : (
            <div className="flex flex-col md:flex-row md:space-x-6">
              {callData.length > 0 && (
                <div className="w-full md:w-44 flex justify-center">
                  <Doughnut
                    data={pieData}
                    options={pieOptions}
                    className="m-0"
                  />
                </div>
              )}

              <Card className="w-full rounded-xl shadow-lg p-6 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <CardHeader className="pb-1 font-medium"></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                    <div className="flex flex-col items-center justify-center bg-green-500/10 backdrop-blur-sm p-4 rounded-lg shadow-md">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Completed Calls
                      </p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {completedCalls}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-red-500/10 backdrop-blur-sm p-4 rounded-lg shadow-md">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Failed Calls
                      </p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                        {failedCalls}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-yellow-500/10 backdrop-blur-sm p-4 rounded-lg shadow-md">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Pending Calls
                      </p>
                      <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                        {pendingCalls}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-blue-500/10 backdrop-blur-sm p-4 rounded-lg shadow-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Avg. Call Duration
                      </p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {avgCallDuration} min
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <WordFadeIn words="Your Agents" className="text-xl md:text-2xl" />
        <Link href="/agents/add">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 backdrop-blur-sm"
          >
            <IoAddCircleOutline className="h-4 w-4" />
            <span>Add Agent</span>
          </Button>
        </Link>
      </div>

      <div className="relative flex flex-col md:flex-row w-full mt-6 items-start justify-center overflow-hidden rounded-2xl border bg-white/30 dark:bg-black/30 backdrop-blur-xl p-7 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start w-full px-4">
          <div className="flex-1 max-w-[65rem] mb-4 md:mb-0">
            {calls.loading ? (
              <Loading />
            ) : calls.error ? (
              <p className="text-red-500">{calls.error}</p>
            ) : topAgents.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <p>No calls found</p>
            )}
          </div>

          <div className="ml-0 md:ml-4 w-full max-w-[25rem]">
            {agents.loading ? (
              <Loading />
            ) : agents.error ? (
              <p className="text-red-500">{agents.error}</p>
            ) : (
              <div>
                {topAgents.map((agent) => (
                  <Link key={agent.uid} href={`/agents/${agent.uid}`}>
                    <Card className="w-full mb-4 bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-black/60 transition-all">
                      <CardHeader className="pb-1 font-medium">
                        {agent.agentName}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          {agent.callCount} call
                          {agent.callCount === 1 ? "" : "s"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <WordFadeIn words="Your Campaigns" className="text-xl md:text-2xl" />
        <Link href="/campaigns/add">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 backdrop-blur-sm"
          >
            <IoAddCircleOutline className="h-4 w-4" />
            <span>Add Campaign</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6 mb-12">
        {campaigns.loading ? (
          <Loading />
        ) : campaigns.error ? (
          <p>{campaigns.error}</p>
        ) : (
          campaigns.data?.map((campaign) => (
            <Link key={campaign.uid} href={`/campaigns/${campaign.uid}`}>
              <Card className="w-full bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-black/60 transition-all">
                <CardHeader className="pb-1 font-medium">
                  {campaign.name}
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{campaign.callIds.length} Calls</p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="mb-10">
        <div
          className="flex flex-row hover:cursor-pointer w-fit items-center"
          onClick={() => setCollapse(!collapse)}
        >
          {collapse ? (
            <ChevronDownIcon className="h-6 w-6 mr-3" />
          ) : (
            <ChevronUpIcon className="h-6 w-6 mr-3" />
          )}
          <WordFadeIn words="API Access" className="text-xl md:text-2xl" />
        </div>

        {collapse ? (
          <div></div>
        ) : (
          <div className="p-6 rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-xl mt-4">
            <div className="mt-4">
              <Label>User ID</Label>
              <p
                className={cn(
                  "p-3 mt-1 text-sm rounded bg-white/50 dark:bg-black/50 backdrop-blur-sm text-gray-700 dark:text-gray-300"
                )}
              >
                {user.uid}
              </p>
            </div>

            <div className="mt-6">
              <Label>API Key</Label>
              <div className="relative mt-1">
                <p
                  className={cn(
                    "p-3 pr-12 text-sm rounded bg-white/50 dark:bg-black/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 overflow-hidden",
                    !canSeeAPIKey && "cursor-pointer"
                  )}
                  onClick={() => {
                    setCanSeeAPIKey(true);
                  }}
                >
                  {canSeeAPIKey ? user.apiKey : "••••••••••••••••••••"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setCanSeeAPIKey(!canSeeAPIKey)}
                >
                  {canSeeAPIKey ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  );
}
