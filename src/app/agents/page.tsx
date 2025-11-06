"use client";

import Loading from "@/components/Loading";
import { Header } from "@/components/Typography";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import ShimmerButton from "@/components/ui/shimmer-button";
import useUser from "@/hooks/useUser";
import { getAgents } from "@/lib/api/agents";
import { TAgent, TFetched } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowRightIcon,
  CalendarIcon,
  PlusIcon,
  UserIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const EmptyState = () => (
  <div className="relative flex flex-col items-center justify-center p-12 text-center rounded-xl border-2 border-dashed bg-gradient-to-b from-muted/30 to-muted/10 overflow-hidden animate-fade-in">
    <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
    <UserIcon className="w-16 h-16 text-muted-foreground mb-6 animate-float" />
    <h3 className="text-xl font-semibold mb-3">No Agents Found</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
      Get started by creating your first AI agent. Unlock the potential of
      automated assistance.
    </p>
    <button className="shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg">
      <Link
        href="/agents/add"
        className="flex items-center text-white px-6 py-2"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Create Your First Agent
      </Link>
    </button>
  </div>
);

const AgentsTable = ({ agents }: { agents: TFetched<TAgent[]> }) => {
  if (agents.loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (agents.error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-destructive">
        {agents.error}
      </div>
    );
  }

  if (!agents.data || agents.data.length <= 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.data.map((agent, index) => (
        <Link
          key={agent.uid}
          href={`/agents/${agent.uid}`}
          className="group h-full"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <Card className="relative w-full h-full rounded-xl transition-all duration-500 hover:shadow-xl hover:-translate-y-1 animate-fade-in bg-gradient-to-br from-card to-muted/20 border-border/50 overflow-hidden backdrop-blur-sm flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16 border-2 border-background shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xl font-semibold">
                    {agent.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3 h-3 text-primary-foreground" />
                </span>
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-lg font-semibold leading-tight tracking-tight break-words">
                  {agent.name}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center">
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-70 flex-shrink-0" />
                  {new Date(agent.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardHeader>
            <CardContent className="pb-6 flex-1">
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {agent.description}
              </p>
            </CardContent>
            <CardFooter className="justify-between pt-4 border-t border-border/50 mt-auto">
              <Badge
                variant="secondary"
                className="font-medium bg-gradient-to-r from-primary/10 to-primary/5"
              >
                AI Agent
              </Badge>
              <span className="text-sm font-medium text-primary flex items-center group-hover:text-primary/80 transition-colors">
                View Details
                <ArrowRightIcon className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
              </span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default function Page() {
  const { organisation } = useUser();
  const [agents, setAgents] = useState<TFetched<TAgent[]>>({
    loading: true,
    data: undefined,
  });

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

  return (
    <div className="relative min-h-screen">
      <div className="absolute rounded-xl inset-0 bg-gradient-to-br from-background via-background to-muted pointer-events-none" />
      <div className="absolute rounded-xl inset-0  bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div className="relative max-w-[1600px] rounded-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold md:text-3xl mb-3 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              Your AI Agents
            </h1>
            <p className="text-base text-muted-foreground">
              Manage and monitor your intelligent assistants in one place
            </p>
          </div>
          <button className="shadow-2xl animate-fade-in bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg">
            <Link
              href="/agents/add"
              className="flex items-center text-white py-1"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Agent
            </Link>
          </button>
        </div>
        <AgentsTable agents={agents} />
      </div>
    </div>
  );
}