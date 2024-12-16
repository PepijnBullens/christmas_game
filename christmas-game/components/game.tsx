import Phaser from "phaser";
import { useEffect } from "react";

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

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  const preload = function (this: Phaser.Scene) {
    this.load.image("player", "/images/player.png");
  };

  const create = function (this: Phaser.Scene) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const player = this.matter.add.sprite(centerX, centerY, "player");
    player.setCircle(player.width / 2); // Circle body for the player

    const cursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.registry.set("player", player);
    this.registry.set("cursors", cursors);

    const startPoint = { x: 0, y: 0 };
    const endPoint = { x: 200, y: 200 };
    const angle = 10;

    createCurvedLine(this, startPoint, endPoint, angle, 50);
  };

  const createCurvedLine = function (
    scene: Phaser.Scene,
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    angle: number,
    curveSegments: number
  ) {
    const angleFactor = ((angle / 100) * Math.PI) / 2;

    const midPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
    };

    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / length;
    const normalY = dx / length;

    const controlPoint = {
      x: midPoint.x + normalX * Math.sin(angleFactor) * length,
      y: midPoint.y + normalY * Math.sin(angleFactor) * length,
    };

    for (let i = 0; i <= curveSegments; i++) {
      const t = i / curveSegments;

      const x =
        (1 - t) * (1 - t) * startPoint.x +
        2 * (1 - t) * t * controlPoint.x +
        t * t * endPoint.x;
      const y =
        (1 - t) * (1 - t) * startPoint.y +
        2 * (1 - t) * t * controlPoint.y +
        t * t * endPoint.y;

      scene.matter.add.circle(x, y, 5, { isStatic: true });
    }
  };

  const update = function (this: Phaser.Scene) {
    const player = this.registry.get("player") as Phaser.Physics.Matter.Sprite;
    const cursors = this.registry.get("cursors");

    if (!player || !cursors) return;

    const speed = 5;

    if (cursors.left?.isDown) {
      player.setVelocityX(-speed);
    } else if (cursors.right?.isDown) {
      player.setVelocityX(speed);
    } else {
      player.setVelocityX(0);
    }

    if (cursors.up?.isDown) {
      player.setVelocityY(-speed);
    } else if (cursors.down?.isDown) {
      player.setVelocityY(speed);
    } else {
      player.setVelocityY(0);
    }
  };

  return <div id="phaser-game" />;
};

export default game;
