"use client";
import WardDoctorDashboard from "@/components/ward-doctor-dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function WardDoctorPage() {
  return (
    <SidebarProvider>
      <WardDoctorDashboard />
    </SidebarProvider>
  );
}
