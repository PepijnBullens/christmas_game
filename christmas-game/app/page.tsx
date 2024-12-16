"use client";

import dynamic from "next/dynamic";
import SnowBackground from "@/components/SnowBackground";

const PhaserGame = dynamic(() => import("../components/Game"), {
  ssr: false,
});

const Home: React.FC = () => {
  return (
    <div>
      <SnowBackground />
      <PhaserGame />
    </div>
  );
};

export default Home;
