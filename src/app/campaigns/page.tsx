"use client";

import Loading from "@/components/Loading";
import { Header } from "@/components/Typography";
import useUser from "@/hooks/useUser";
import {
  getCampaigns,
  getCampaignsAfter,
  updateCallField,
} from "@/lib/api/campaigns";
import { TCampaign, TFetched } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ShimmerButton from "@/components/ui/shimmer-button";
import {
  ArrowRightIcon,
  CalendarIcon,
  Users2,
  MegaphoneIcon,
  Sparkles,
  ChevronDownIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const EmptyState = () => (
  <div className="relative flex flex-col items-center justify-center p-16 text-center rounded-2xl border-2 border-dashed bg-gradient-to-b from-muted/30 to-muted/5 overflow-hidden animate-fade-in backdrop-blur-sm">
    <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,transparent,black)] opacity-50" />
    <div className="relative z-10 backdrop-blur-sm p-8 rounded-2xl bg-background/50">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl" />
      <MegaphoneIcon className="w-20 h-20 text-primary/60 mb-8 mx-auto animate-float" />
      <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
        No Campaigns Yet
      </h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
        Start your first campaign to reach out to your customers and drive
        engagement.
      </p>
      <ShimmerButton
        className="shadow-2xl scale-105"
        background="rgb(255, 119, 0)"
        borderRadius="16px"
      >
        <Link
          href="/campaigns/add"
          className="flex items-center text-white px-8 py-3"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Your First Campaign
        </Link>
      </ShimmerButton>
    </div>
  </div>
);

const CampaignCard = ({
  campaign,
  index,
}: {
  campaign: TCampaign;
  index: number;
}) => (
  <Link
    href={`/campaigns/${campaign.uid}`}
    className="group"
    style={{
      animationDelay: `${index * 100}ms`,
    }}
  >
    <Card className="relative rounded-xl w-full h-full max-w-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1 animate-fade-in bg-gradient-to-br from-card to-muted/20 border-border/50 overflow-hidden backdrop-blur-sm">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <div className="relative">
          <div className="absolute h-full inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-lg transform group-hover:scale-110 transition-transform duration-500" />
          <Avatar className="h-12 w-12 border-2 border-background shadow-xl relative">
            <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground text-lg font-semibold">
              {campaign.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-3 h-3 text-primary-foreground" />
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold leading-none tracking-tight group-hover:text-primary transition-colors duration-300">
            {campaign.name}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center">
            <CalendarIcon className="w-3 h-3 mr-1 opacity-70" />
            {new Date(campaign.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Customers
            </p>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                <Users2 className="w-3.5 h-3.5 text-primary/70" />
              </div>
              <span className="font-semibold text-base">
                {campaign.callIds.length}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <Badge
              variant="secondary"
              className="font-medium bg-gradient-to-r from-primary/10 to-primary/5 px-2 py-1 text-xs"
            >
              {campaign.status}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Created {new Date(campaign.createdAt).toLocaleDateString()}
        </p>
        <span className="text-xs font-medium text-primary flex items-center group-hover:text-primary/80 transition-colors">
          View Details
          <ArrowRightIcon className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
        </span>
      </CardFooter>
    </Card>
  </Link>
);

const CampaignGrid = ({ campaigns }: { campaigns: TFetched<TCampaign[]> }) => {
  if (campaigns.loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (campaigns.error) {
    return (
      <div className="min-h-[500px] flex items-center justify-center text-destructive">
        {campaigns.error}
      </div>
    );
  }

  if (!campaigns.data || campaigns.data.length <= 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {campaigns.data.map((campaign, index) => (
        <CampaignCard key={campaign.uid} campaign={campaign} index={index} />
      ))}
    </div>
  );
};

function Page() {
  const { organisation } = useUser();
  const [campaigns, setCampaigns] = useState<TFetched<TCampaign[]>>({
    loading: true,
    data: undefined,
  });
  const [lastCampaign, setLastCampaign] = useState<any | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!organisation) return;
      try {
        const res = await getCampaigns(organisation.uid, 9);
        if (res.length < 9) {
          setFinished(true);
        } else {
          setLastCampaign(res[res.length - 1]);
        }
        setCampaigns({ loading: false, data: res, error: undefined });
      } catch (error: any) {
        setCampaigns({ loading: false, data: [], error: error.message });
      }
    };

    fetchCampaigns();
  }, [organisation]);

  const loadMoreCampaigns = async () => {
    setLoadingMore(true);
    try {
      const res = await getCampaignsAfter(organisation!.uid, 6, lastCampaign);
      if (res.campaigns.length < 6) {
        setFinished(true);
      } else {
        setLastCampaign(res.lastVisibleDoc);
      }
      setCampaigns({
        loading: false,
        data: [...campaigns.data!, ...res.campaigns],
        error: undefined,
      });
    } catch (error: any) {
      setCampaigns({ loading: false, data: [], error: error.message });
    }
    setLoadingMore(false);
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute rounded-xl inset-0 bg-gradient-to-br from-background via-background to-muted pointer-events-none" />
      <div className="absolute rounded-xl inset-0  bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-16 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="animate-fade-in">
            <Header className="text-3xl font-bold md:text-3xl mb-4 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              Your Campaigns
            </Header>
            <p className="text-base text-muted-foreground leading-relaxed">
              Manage and track your outreach campaigns effectively
            </p>
          </div>
          <ShimmerButton
            className="shadow-2xl animate-fade-in scale-105"
            background="rgb(255, 119, 0)"
            borderRadius="16px"
          >
            <Link
              href="/campaigns/add"
              className="flex items-center text-white py-1"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Campaign
            </Link>
          </ShimmerButton>
        </div>
        <CampaignGrid campaigns={campaigns} />
        {!finished && campaigns.data && campaigns.data.length > 0 && (
          <div className="flex justify-center mt-12 animate-fade-in">
            {loadingMore ? (
              <span className="flex items-center">
                <Loading className="w-5 h-5 mr-2" />
              </span>
            ) : (
              <Button
                onClick={loadMoreCampaigns}
                disabled={loadingMore}
                size="lg"
                className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl group px-8"
              >
                <span className="flex items-center">
                  Load More Campaigns
                  <ChevronDownIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-y-0.5" />
                </span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
