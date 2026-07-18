import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Brain, Activity, Zap, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

// Mock Data
const growthData = [
  { name: "Week 1", growth: 10 },
  { name: "Week 2", growth: 25 },
  { name: "Week 3", growth: 20 },
  { name: "Week 4", growth: 45 },
];

const dnaData = [
  { axis: "Technical", value: 80 },
  { axis: "Creative", value: 65 },
  { axis: "Strategic", value: 90 },
  { axis: "Leadership", value: 75 },
  { axis: "Networking", value: 70 },
];

const activityData = [
  { day: "Mon", activity: 5 },
  { day: "Tue", activity: 8 },
  { day: "Wed", activity: 3 },
  { day: "Thu", activity: 10 },
  { day: "Fri", activity: 7 },
];

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        icon={BarChart3}
        accent="Growth Analytics"
        title="Your Growth, Visualized"
        description="Graphs, heatmaps, weekly/monthly reports, aur leaderboards — sab aapki growth ka data-driven view."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Growth Report */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="flex items-center gap-2 font-semibold mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            Weekly Growth
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="growth" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Heatmap */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="flex items-center gap-2 font-semibold mb-4">
            <Brain className="h-5 w-5 text-primary" />
            Skill Heatmap
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dnaData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" />
              <PolarRadiusAxis />
              <Radar
                name="Growth DNA"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Charts */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="flex items-center gap-2 font-semibold mb-4">
            <Activity className="h-5 w-5 text-primary" />
            Activity Charts
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="activity" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Streaks */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="flex items-center gap-2 font-semibold mb-4">
            <Zap className="h-5 w-5 text-primary" />
            Streaks
          </h3>
          <div className="text-4xl font-bold">12 Days</div>
          <p className="text-muted-foreground">Consistency is key!</p>
        </div>

        {/* Leaderboards */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="flex items-center gap-2 font-semibold mb-4">
            <Users className="h-5 w-5 text-primary" />
            Peer Leaderboards
          </h3>
          <div className="text-sm text-muted-foreground">
            Opt-in to see how you rank against other RaahAI builders.
          </div>
        </div>
      </div>
    </div>
  );
}
