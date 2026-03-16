"use client";
import dynamic from "next/dynamic";
const MsbizSidebar = dynamic(() => import("./MsbizSidebar"), { ssr: false });
export default function MsbizSidebarWrapper() {
  return <MsbizSidebar />;
}
