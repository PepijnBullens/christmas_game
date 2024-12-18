"use client";

import dynamic from "next/dynamic";
import SnowBackground from "@/components/SnowBackground";

const PhaserGame = dynamic(() => import("../../components/Game"), {
  ssr: false,
});

export default function Index() {
  return (
    <>
      <SnowBackground />
      <PhaserGame />
    </>
  );
}
