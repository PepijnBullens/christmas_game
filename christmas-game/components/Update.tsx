import Phaser from "phaser";

const stickRotation = function (
  scene: Phaser.Scene,
  stickKeys: any,
  stick: Phaser.Physics.Matter.Sprite
) {
  const player = scene.registry.get("player") as Phaser.Physics.Matter.Sprite;
  const angleSpeed = 0.15; // Adjust the rotation speed as needed

  // Prevent physics engine from applying rotation when rotating manually
  stick.setAngularVelocity(0); // Disable the angular velocity applied by physics

  // Rotate the stick based on input keys
  if (stickKeys.left?.isDown) {
    stick.rotation -= angleSpeed;
  } else if (stickKeys.right?.isDown) {
    stick.rotation += angleSpeed;
  }

  // Get the current position of the player
  const playerX = player.x;
  const playerY = player.y;

  // The distance between the player and the stick (fixed by the constraint)
  const distance = 40; // Adjust this value as needed

  // Calculate the new position of the stick based on its rotation and the player's position
  const offsetX = Math.cos(stick.rotation) * distance;
  const offsetY = Math.sin(stick.rotation) * distance;

  // Update the position of the stick without affecting the player's movement
  stick.setPosition(playerX + offsetX, playerY + offsetY);

  // We don't need to set the constraint's pointA directly since it's managed by Matter.js
};

const sprint = function (
  this: Phaser.Scene,
  player: Phaser.Physics.Matter.Sprite,
  movementKeys: Phaser.Types.Input.Keyboard.CursorKeys
) {
  const speed = 10;
  const tryingToSprint = movementKeys.shift?.isDown; // Whether the player is sprinting
  const canSprint = this.registry.get("currentStamina") > 0;

  // Sprinting
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
  } else {
    this.registry.set("isSprinting", false);
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

  const sprintCost = 2; // Adjust the cost per frame
  const sprintRegen = 1; // Adjust the regeneration per frame

  if (currentStamina <= 0 && !regenerate) {
    if (this.registry.get("staminaCooldown") == null) {
      this.registry.set("staminaCooldown", Date.now());
    } else {
      const cooldown = 3000; // 3 seconds
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

  // Clear previous frame
  staminaBar.clear();

  // Draw the background of the stamina bar (gray)
  staminaBar.fillStyle(0x0000ff, 1); // Color of the background
  staminaBar.fillRect(50, 50, 50, staminaHeight);

  // Draw the current stamina (green)
  staminaBar.fillStyle(0x00ff00, 1); // Color of the stamina (green)
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

  if (pitch && puck) {
    const pitchBounds = pitch.getBounds();
    const puckBounds = puck.getBounds();

    if (!Phaser.Geom.Intersects.RectangleToRectangle(pitchBounds, puckBounds)) {
      this.scene.restart();
    }
  }
};

export default function Update(this: Phaser.Scene) {
  const player = this.registry.get("player") as Phaser.Physics.Matter.Sprite;
  const stick = this.registry.get("stick") as Phaser.Physics.Matter.Sprite;
  const movementKeys = this.registry.get("movementKeys");
  const stickKeys = this.registry.get("stickKeys");

  if (!player || !stick || !movementKeys || !stickKeys) return;

  const speed = 5;

  // Player movement
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

  sprint.call(
    this,
    player,
    movementKeys as Phaser.Types.Input.Keyboard.CursorKeys
  );

  // Stick rotation around the player
  stickRotation(
    this,
    stickKeys as Phaser.Types.Input.Keyboard.CursorKeys,
    stick
  );

  staminaBar.call(this);

  checkOutOfBounds.call(this);
}
