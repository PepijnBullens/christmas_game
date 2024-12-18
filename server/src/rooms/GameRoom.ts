import { Room, Client } from "@colyseus/core";
import { GameRoomState } from "./schema/GameRoomState";

export class GameRoom extends Room<GameRoomState> {
  maxClients = 2;

  onCreate() {
    this.resetAutoDisposeTimeout(1);

    // Listen for messages from clients
    this.onMessage("message", (client, message) => {
      console.log(`Message received from ${client.sessionId}: ${message}`);

      // Broadcast the message to all connected clients
      this.broadcast("message", { sessionId: client.sessionId, message });
    });
  }

  onJoin(client: Client) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
