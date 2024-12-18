import { Room, Client } from "@colyseus/core";
import { Schema, type, MapSchema } from "@colyseus/schema";
import Matter from "matter-js";

// Define the player schema
class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
}

// Define the game state schema
export class GameRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

// Extend the Colyseus room for game logic
export class GameRoom extends Room<GameRoomState> {
  maxClients = 2; // Maximum 2 players
  engine: Matter.Engine;
  playerBodies: Map<string, Matter.Body> = new Map();

  onCreate() {
    // Initialize Matter.js engine
    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 0;

    // Set the initial state
    this.setState(new GameRoomState());

    // Create collision borders around the edges of the screen
    const canvaswidth = 800;
    const canvasheight = 600;
    const thickness = 200;

    const borders = [
      // Top border
      Matter.Bodies.rectangle(
        canvaswidth / 2,
        -thickness / 2,
        canvaswidth,
        thickness,
        { isStatic: true }
      ),
      // Bottom border
      Matter.Bodies.rectangle(
        canvaswidth / 2,
        canvasheight + thickness / 2,
        canvaswidth,
        thickness,
        { isStatic: true }
      ),
      // Left border
      Matter.Bodies.rectangle(
        -thickness / 2,
        canvasheight / 2,
        thickness,
        canvasheight,
        { isStatic: true }
      ),
      // Right border
      Matter.Bodies.rectangle(
        canvaswidth + thickness / 2,
        canvasheight / 2,
        thickness,
        canvasheight,
        { isStatic: true }
      ),
    ];

    Matter.World.add(this.engine.world, borders);

    // Game loop for physics
    this.clock.setInterval(() => {
      Matter.Engine.update(this.engine, 1000 / 60); // Update physics engine
      this.broadcastPlayerPositions(); // Sync positions to clients
    }, 1000 / 60);

    // Register message handling
    this.onMessage(
      "request_player_movement",
      (client, message: { x: number; y: number }) => {
        const playerBody = this.playerBodies.get(client.sessionId);
        if (playerBody) {
          const speed = 5; // Define a constant speed
          Matter.Body.setVelocity(playerBody, {
            x: playerBody.velocity.x + message.x * speed,
            y: playerBody.velocity.y + message.y * speed,
          });
        }
      }
    );
  }

  onJoin(client: Client) {
    console.log(`${client.sessionId} joined the room.`);

    // Initialize the player
    const player = new Player();
    this.state.players.set(client.sessionId, player);

    const canvaswidth = 800;
    const canvasheight = 600;
    const playerStartOffset = 100;

    // Determine spawn position based on the number of players
    const spawnX =
      this.clients.length === 1
        ? playerStartOffset
        : canvaswidth - playerStartOffset; // Example positions
    const spawnY = canvasheight / 2; // Center of the screen
    const size = 40;

    const playerBody = Matter.Bodies.circle(spawnX, spawnY, size);
    Matter.World.add(this.engine.world, playerBody);
    this.playerBodies.set(client.sessionId, playerBody);

    const opponent = this.clients.find((c) => c.sessionId !== client.sessionId);

    const setup = {
      player: {
        playerId: client.sessionId,
        x: spawnX,
        y: spawnY,
        size,
      },
      opponent: {
        playerId: opponent?.sessionId,
        x: opponent
          ? this.playerBodies.get(opponent.sessionId)?.position.x
          : undefined,
        y: opponent
          ? this.playerBodies.get(opponent.sessionId)?.position.y
          : undefined,
      },
      screen: {
        width: canvaswidth,
        height: canvasheight,
      },
    };

    client.send("setup", setup);

    if (opponent) {
      const opponentBody = this.playerBodies.get(opponent.sessionId);
      if (opponentBody) {
        const existingPlayerSetup = {
          playerId: client.sessionId,
          x: spawnX,
          y: spawnY,
        };
        opponent.send("opponent_position", existingPlayerSetup);
      }
    }
  }

  broadcastPlayerPositions() {
    // Update player positions from Matter.js bodies
    for (const [sessionId, body] of this.playerBodies.entries()) {
      const player = this.state.players.get(sessionId);
      if (player) {
        player.x = body.position.x;
        player.y = body.position.y;
      }
    }

    // Prepare positions to broadcast
    const positions = Array.from(this.state.players.entries()).map(
      ([sessionId, player]) => ({
        playerId: sessionId,
        x: player.x,
        y: player.y,
      })
    );

    // Broadcast positions to all clients
    this.broadcast("update_players", positions);
  }

  onLeave(client: Client) {
    console.log(`${client.sessionId} left the room.`);
    this.state.players.delete(client.sessionId);

    this.broadcast("client_left", client.sessionId);

    const playerBody = this.playerBodies.get(client.sessionId);
    if (playerBody) {
      Matter.World.remove(this.engine.world, playerBody);
      this.playerBodies.delete(client.sessionId);
    }

    // Disconnect the remaining player
    this.clients.forEach((remainingClient) => {
      if (remainingClient.sessionId !== client.sessionId) {
        remainingClient.leave();
      }
    });
  }

  onDispose() {
    console.log(`Room ${this.roomId} is disposing.`);
  }
}
