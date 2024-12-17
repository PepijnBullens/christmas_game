import Phaser from "phaser";

interface MovementKeys {
  left?: Phaser.Input.Keyboard.Key;
  right?: Phaser.Input.Keyboard.Key;
  up?: Phaser.Input.Keyboard.Key;
  down?: Phaser.Input.Keyboard.Key;
  shift?: Phaser.Input.Keyboard.Key;
}

interface RotationKeys {
  left?: Phaser.Input.Keyboard.Key;
  right?: Phaser.Input.Keyboard.Key;
}

interface Player extends Phaser.Physics.Matter.Sprite {}

const movement = function (
  this: Phaser.Scene,
  movementKeys: MovementKeys,
  player: Player
) {
  const gamepad = this.registry.get("gamepad") as Phaser.Input.Gamepad.Gamepad;

  const speed = 5;

  if (movementKeys.left?.isDown) {
    player.setVelocityX(-speed);
  } else if (movementKeys.right?.isDown) {
    player.setVelocityX(speed);
  }

  if (movementKeys.up?.isDown) {
    player.setVelocityY(-speed);
  } else if (movementKeys.down?.isDown) {
    player.setVelocityY(speed);
  }

  if (gamepad) {
    const padX = gamepad.axes[0].getValue();
    const padY = gamepad.axes[1].getValue();

    if (Math.abs(padX) > 0.1) {
      player.setVelocityX(padX * speed);
    }

    if (Math.abs(padY) > 0.1) {
      player.setVelocityY(padY * speed);
    }
  }
};

const sprint = function (
  this: Phaser.Scene,
  player: Phaser.Physics.Matter.Sprite,
  movementKeys: MovementKeys
) {
  const gamepad = this.registry.get("gamepad") as Phaser.Input.Gamepad.Gamepad;

  const speed = 10;
  const tryingToSprint =
    movementKeys.shift?.isDown || gamepad?.buttons[6].value > 0;
  const canSprint = this.registry.get("currentStamina") > 0;

  if (tryingToSprint && canSprint) {
    this.registry.set("isSprinting", true);

    if (movementKeys.left?.isDown) {
      player.setVelocityX(-speed);
    } else if (movementKeys.right?.isDown) {
      player.setVelocityX(speed);
    }

    if (movementKeys.up?.isDown) {
      player.setVelocityY(-speed);
    } else if (movementKeys.down?.isDown) {
      player.setVelocityY(speed);
    }

    if (gamepad) {
      const padX = gamepad.axes[0].getValue();
      const padY = gamepad.axes[1].getValue();

      if (Math.abs(padX) > 0.1) {
        player.setVelocityX(padX * speed);
      }

      if (Math.abs(padY) > 0.1) {
        player.setVelocityY(padY * speed);
      }
    }
  } else {
    this.registry.set("isSprinting", false);
  }
};

const rotation = function (
  this: Phaser.Scene,
  player: Player,
  rotationKeys: RotationKeys
) {
  const gamepad = this.registry.get("gamepad") as Phaser.Input.Gamepad.Gamepad;

  const speed = 0.1;

  if (rotationKeys.left?.isDown) {
    player.setAngularVelocity(-speed);
  } else if (rotationKeys.right?.isDown) {
    player.setAngularVelocity(speed);
  }

  if (gamepad) {
    const padX = gamepad.axes[2].getValue();
    const padY = gamepad.axes[3].getValue();
    const offset = Math.PI / 2;

    if (Math.abs(padX) > 0.1 || Math.abs(padY) > 0.1) {
      const angle = Math.atan2(padY, padX);
      player.setRotation(angle + offset);
    }
  }
};

const staminaBar = function (this: Phaser.Scene) {
  const maxStamina = 100;
  const staminaHeight = 400;
  const staminaBar = this.registry.get("staminaBar");

  if (this.registry.get("currentStamina") == null) {
    this.registry.set("currentStamina", maxStamina);
  }

  const currentStamina = this.registry.get("currentStamina");
  const isSprinting = this.registry.get("isSprinting") || false;
  let regenerate = this.registry.get("regenerate") || false;

  const sprintCost = 2;
  const sprintRegen = 1;

  if (currentStamina <= 0 && !regenerate) {
    if (this.registry.get("staminaCooldown") == null) {
      this.registry.set("staminaCooldown", Date.now());
    } else {
      const cooldown = 3000;
      const elapsedTime = Date.now() - this.registry.get("staminaCooldown");

      if (elapsedTime >= cooldown) {
        this.registry.set("staminaCooldown", null);
        this.registry.set("regenerate", true);
      }
    }
  } else {
    if (isSprinting) {
      this.registry.set("regenerate", false);
      regenerate = false;

      this.registry.set(
        "currentStamina",
        Math.max(0, currentStamina - sprintCost)
      );
    } else {
      if (regenerate || this.registry.get("staminaCooldown") == null) {
        this.registry.set(
          "currentStamina",
          Math.min(maxStamina, currentStamina + sprintRegen)
        );
      }
    }
  }

  staminaBar.clear();

  staminaBar.fillStyle(0x0000ff, 1);
  staminaBar.fillRect(50, 50, 50, staminaHeight);

  staminaBar.fillStyle(0x00ff00, 1);
  staminaBar.fillRect(
    50,
    50 + staminaHeight - (currentStamina / maxStamina) * staminaHeight,
    50,
    (currentStamina / maxStamina) * staminaHeight
  );
};

const checkOutOfBounds = function (this: Phaser.Scene) {
  const pitch = this.registry.get("pitch") as Phaser.Physics.Matter.Sprite;
  const puck = this.registry.get("puck") as Phaser.Physics.Matter.Sprite;
  const player = this.registry.get("player") as Phaser.Physics.Matter.Sprite;

  if (pitch && puck && player) {
    const pitchBounds = pitch.getBounds();
    const puckBounds = puck.getBounds();
    const playerBounds = player.getBounds();

    if (
      !Phaser.Geom.Intersects.RectangleToRectangle(pitchBounds, puckBounds) ||
      !Phaser.Geom.Intersects.RectangleToRectangle(pitchBounds, playerBounds)
    ) {
      puck.setPosition(pitch.x, pitch.y);
      puck.setVelocity(0, 0);
      player.setPosition(pitch.x, pitch.y);
      player.setVelocity(0, 0);
    }
  }
};

export default function Update(this: Phaser.Scene) {
  const player = this.registry.get("player") as Phaser.Physics.Matter.Sprite;
  const movementKeys = this.registry.get("movementKeys");
  const rotationKeys = this.registry.get("rotationKeys");

  if (!player || !movementKeys || !rotationKeys) return;

  movement.call(
    this,
    movementKeys as Phaser.Types.Input.Keyboard.CursorKeys,
    player
  );

  sprint.call(
    this,
    player,
    movementKeys as Phaser.Types.Input.Keyboard.CursorKeys
  );

  rotation.call(
    this,
    player,
    rotationKeys as Phaser.Types.Input.Keyboard.CursorKeys
  );

  staminaBar.call(this);
  checkOutOfBounds.call(this);
}
