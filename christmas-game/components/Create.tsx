import Phaser from "phaser";

const createLine = function (
  scene: Phaser.Scene,
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  angle: number,
  curveSegments: number,
  reverse: boolean
) {
  if (angle === 0) {
    const lineCategory = scene.registry.get("lineCategory");
    scene.matter.add.rectangle(
      (startPoint.x + endPoint.x) / 2,
      (startPoint.y + endPoint.y) / 2,
      Math.abs(endPoint.x - startPoint.x) || 10,
      Math.abs(endPoint.y - startPoint.y) || 10,
      {
        isStatic: true,
        collisionFilter: { category: lineCategory },
      }
    );
    return;
  }

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
  const curveDistance = Math.sin(angleFactor) * length;
  const controlPoint = {
    x: midPoint.x + normalX * curveDistance * (reverse ? -1 : 1),
    y: midPoint.y + normalY * curveDistance * (reverse ? -1 : 1),
  };

  for (let i = 0; i <= curveSegments; i++) {
    const t = i / curveSegments;

    const lineCategory = scene.registry.get("lineCategory");
    const x =
      (1 - t) * (1 - t) * startPoint.x +
      2 * (1 - t) * t * controlPoint.x +
      t * t * endPoint.x;
    const y =
      (1 - t) * (1 - t) * startPoint.y +
      2 * (1 - t) * t * controlPoint.y +
      t * t * endPoint.y;

    const nextT = (i + 1) / curveSegments;
    const nextX =
      (1 - nextT) * (1 - nextT) * startPoint.x +
      2 * (1 - nextT) * nextT * controlPoint.x +
      nextT * nextT * endPoint.x;
    const nextY =
      (1 - nextT) * (1 - nextT) * startPoint.y +
      2 * (1 - nextT) * nextT * controlPoint.y +
      nextT * nextT * endPoint.y;

    const angle = Phaser.Math.Angle.Between(x, y, nextX, nextY);

    scene.matter.add.rectangle(x, y, 10, 10, {
      isStatic: true,
      angle: angle,
      collisionFilter: { category: lineCategory },
    });
  }
};

export default function create(this: Phaser.Scene) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const pitch = this.add.image(centerX, centerY, "pitch");
  const scale = Math.min(
    window.innerWidth / pitch.width,
    window.innerHeight / pitch.height
  );
  pitch.setScale(scale);
  pitch.setDepth(-1);
  this.registry.set("pitch", pitch);

  const player = this.matter.add.sprite(centerX, centerY, "player");
  player.setBody({
    type: "rectangle",
    width: player.width,
    height: player.height / 2,
  });
  player.setFrictionAir(0.05);
  this.registry.set("player", player);

  const movementKeys = this.input.keyboard?.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  });

  const rotationKeys = this.input.keyboard?.addKeys({
    left: Phaser.Input.Keyboard.KeyCodes.LEFT,
    right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
  });

  this.registry.set("movementKeys", movementKeys);
  this.registry.set("rotationKeys", rotationKeys);

  const puck = this.matter.add.sprite(centerX, centerY + 100, "player");
  puck.setCircle(puck.width / 2);
  puck.setScale(0.5);
  puck.setFrictionAir(0.001);
  puck.setBounce(0.9);
  puck.setBounce(1);
  puck.setFixedRotation();

  this.registry.set("puck", puck);

  const staminaBar = this.add.graphics();
  this.registry.set("staminaBar", staminaBar);

  const playerCategory = this.matter.world.nextCategory();
  const lineCategory = this.matter.world.nextCategory();
  const puckCategory = this.matter.world.nextCategory();

  player.setCollisionCategory(playerCategory);
  puck.setCollisionCategory(puckCategory);

  player.setCollidesWith([lineCategory, puckCategory]);
  puck.setCollidesWith([lineCategory, playerCategory]);

  this.registry.set("lineCategory", lineCategory);

  this.input.gamepad?.once("connected", (pad: Phaser.Input.Gamepad.Gamepad) => {
    this.registry.set("gamepad", pad);
    console.log("Gamepad connected");
  });

  const ringWidth = 800;
  const ringHeight = 520;
  const edgeWidth = 120;
  const edgeHeight = 100;

  createLine(
    this,
    { x: centerX - ringWidth / 2, y: centerY - ringHeight / 2 },
    { x: centerX + ringWidth / 2, y: centerY - ringHeight / 2 },
    0,
    1,
    false
  ); // TOP

  createLine(
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
    1,
    false
  ); // RIGHT

  createLine(
    this,
    { x: centerX - ringWidth / 2, y: centerY - ringHeight / 2 },
    {
      x: centerX - ringWidth / 2 - edgeWidth,
      y: centerY - ringHeight / 2 + edgeHeight,
    },
    30,
    20,
    false
  ); // TOP LEFT

  createLine(
    this,
    { x: centerX + ringWidth / 2, y: centerY - ringHeight / 2 },
    {
      x: centerX + ringWidth / 2 + edgeWidth,
      y: centerY - ringHeight / 2 + edgeHeight,
    },
    -30,
    20,
    false
  ); // TOP RIGHT

  createLine(
    this,
    { x: centerX - ringWidth / 2, y: centerY + ringHeight / 2 },
    {
      x: centerX - ringWidth / 2 - edgeWidth,
      y: centerY + ringHeight / 2 - edgeHeight,
    },
    30,
    20,
    true
  ); // BOTTOM LEFT

  createLine(
    this,
    { x: centerX + ringWidth / 2, y: centerY + ringHeight / 2 },
    {
      x: centerX + ringWidth / 2 + edgeWidth,
      y: centerY + ringHeight / 2 - edgeHeight,
    },
    -30,
    20,
    true
  ); // BOTTOM RIGHT

  createLine(
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
    1,
    false
  ); // LEFT

  createLine(
    this,
    { x: centerX - ringWidth / 2, y: centerY + ringHeight / 2 },
    { x: centerX + ringWidth / 2, y: centerY + ringHeight / 2 },
    0,
    1,
    false
  ); // BOTTOM
}
