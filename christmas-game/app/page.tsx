"use client";

import dynamic from "next/dynamic";

const PhaserGame = dynamic(() => import("../components/game"), {
  ssr: false,
});

const Home: React.FC = () => {
  return <PhaserGame />;
};

export default Home;
