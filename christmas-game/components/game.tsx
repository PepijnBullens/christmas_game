import Phaser from "phaser";
import { useEffect } from "react";
import Create from "@/components/Create";
import Update from "@/components/Update";

const game: React.FC = () => {
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: "matter",
        matter: {
          debug: true,
          gravity: { x: 0, y: 0 },
        },
      },
      scene: {
        preload,
        create,
        update,
      },
    };

    const phaserGame = new Phaser.Game(config);

    return () => {
      phaserGame.destroy(true);
    };
  }, []);

  const preload = function (this: Phaser.Scene) {
    this.load.image("player", "/images/player.png");
    this.load.image("pitch", "/images/hockey-pitch.png");
    this.load.image("stick", "/images/hockey-stick.png");
  };

  const create = async function (this: Phaser.Scene) {
    Create.call(this);
  };

  const update = function (this: Phaser.Scene) {
    Update.call(this);
  };

  return <div id="phaser-game" />;
};

export default game;
