import GeneralState from "@/components/home/GeneralState";
import QuickActions from "@/components/home/QuickActions";
import RecentRequest from "@/components/home/RecentRequest";
import RequestOverview from "@/components/home/RequestOverview";
import DashboardCharts from "@/components/home/DashboardCharts";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <GeneralState />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RequestOverview />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      <DashboardCharts />

      <RecentRequest />
    </div>
  );
}