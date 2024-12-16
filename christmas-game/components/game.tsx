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
    this.load.image("pitch", "/images/hockey-pitch.png");
  };

  const create = function (this: Phaser.Scene) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Add the player sprite
    const player = this.matter.add.sprite(centerX, centerY, "player");
    player.setCircle(player.width / 2); // Circle body for the player

    const pitch = this.add.image(centerX, centerY, "pitch");
    const scale = Math.min(
      window.innerWidth / pitch.width,
      window.innerHeight / pitch.height
    );
    pitch.setScale(scale);
    pitch.setDepth(-1); // Set z-index to 0 to move to background

    // Store the player and cursors in the registry
    const cursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.registry.set("player", player);
    this.registry.set("cursors", cursors);

    const ringWidth = 800;
    const ringHeight = 520;

    const edgeWidth = 120;
    const edgeHeight = 100;

    createCurvedLine(
      this,
      { x: centerX - ringWidth / 2, y: centerY - ringHeight / 2 },
      { x: centerX + ringWidth / 2, y: centerY - ringHeight / 2 },
      0,
      100,
      false
    ); // TOP

    createCurvedLine(
      this,
      {
        x: centerX + ringWidth / 2 + edgeWidth,
        y: centerY - ringHeight / 2 + edgeHeight,
      },
      {
        x: centerX + ringWidth / 2 + edgeWidth,
        y: centerY + ringHeight / 2 - edgeHeight,
      },
      0,
      40,
      false
    ); // RIGHT

    createCurvedLine(
      this,
      { x: centerX - ringWidth / 2, y: centerY - ringHeight / 2 },
      {
        x: centerX - ringWidth / 2 - edgeWidth,
        y: centerY - ringHeight / 2 + edgeHeight,
      },
      30,
      25,
      false
    ); // TOP LEFT

    createCurvedLine(
      this,
      { x: centerX + ringWidth / 2, y: centerY - ringHeight / 2 },
      {
        x: centerX + ringWidth / 2 + edgeWidth,
        y: centerY - ringHeight / 2 + edgeHeight,
      },
      -30,
      25,
      false
    ); // TOP RIGHT

    createCurvedLine(
      this,
      { x: centerX - ringWidth / 2, y: centerY + ringHeight / 2 },
      {
        x: centerX - ringWidth / 2 - edgeWidth,
        y: centerY + ringHeight / 2 - edgeHeight,
      },
      30,
      25,
      true
    ); // BOTTOM LEFT

    createCurvedLine(
      this,
      { x: centerX + ringWidth / 2, y: centerY + ringHeight / 2 },
      {
        x: centerX + ringWidth / 2 + edgeWidth,
        y: centerY + ringHeight / 2 - edgeHeight,
      },
      -30,
      25,
      true
    ); // BOTTOM RIGHT

    createCurvedLine(
      this,
      {
        x: centerX - ringWidth / 2 - edgeWidth,
        y: centerY - ringHeight / 2 + edgeHeight,
      },
      {
        x: centerX - ringWidth / 2 - edgeWidth,
        y: centerY + ringHeight / 2 - edgeHeight,
      },
      0,
      40,
      false
    ); // LEFT

    createCurvedLine(
      this,
      { x: centerX - ringWidth / 2, y: centerY + ringHeight / 2 },
      { x: centerX + ringWidth / 2, y: centerY + ringHeight / 2 },
      0,
      100,
      false
    ); // BOTTOM
  };
  const createCurvedLine = function (
    scene: Phaser.Scene,
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    angle: number,
    curveSegments: number,
    reverse: boolean
  ) {
    // Normalize angle between 0 and 100 to a curve intensity (in radians)
    const angleFactor = ((angle / 100) * Math.PI) / 2; // From 0 to PI/2 (90 degrees max)

    // Calculate the midpoint between the start and end points
    const midPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
    };

    // Calculate the direction of the curve (perpendicular to the line from start to end)
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / length;
    const normalY = dx / length;
    const curveDistance = Math.sin(angleFactor) * length; // Amount of curve based on angle
    let controlPoint = {
      x: midPoint.x + normalX * curveDistance * (reverse ? -1 : 1),
      y: midPoint.y + normalY * curveDistance * (reverse ? -1 : 1),
    };

    // Create the curve by approximating it with small line segments
    for (let i = 0; i <= curveSegments; i++) {
      const t = i / curveSegments;

      // Use a quadratic Bézier curve formula to find the point on the curve
      const x =
        (1 - t) * (1 - t) * startPoint.x +
        2 * (1 - t) * t * controlPoint.x +
        t * t * endPoint.x;
      const y =
        (1 - t) * (1 - t) * startPoint.y +
        2 * (1 - t) * t * controlPoint.y +
        t * t * endPoint.y;

      // Create a small rectangle (acting as a segment of the curve)
      scene.matter.add.rectangle(x, y, 10, 10, { isStatic: true });
    }
  };

  const update = function (this: Phaser.Scene) {
    // Retrieve the player and cursors from the registry
    const player = this.registry.get("player") as Phaser.Physics.Matter.Sprite;
    const cursors = this.registry.get("cursors");

    if (!player || !cursors) return; // Guard clause to ensure player and cursors exist

    const speed = 5;

    // Apply movement using Matter.js
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
