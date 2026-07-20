import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata = {
  title: "Projects",
  robots: { index: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
