"use client";

import { Client, Room } from "colyseus.js";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [room, setRoom] = useState<Room<unknown> | null>(null);

  useEffect(() => {
    const COLYSEUS_SERVER = "ws://localhost:2567";
    const GAME_ROOM = "game_room";
    const client = new Client(COLYSEUS_SERVER);

    const joinRoom = async () => {
      try {
        const joinedRoom = await client.joinOrCreate(GAME_ROOM);
        console.log("Joined room:", joinedRoom);

        // Listen for messages from the server
        joinedRoom.onMessage("message", (data) => {
          console.log("Message received:", data);
          setMessages((prevMessages) => [...prevMessages, data]);
        });

        setRoom(joinedRoom);
      } catch (error) {
        console.error("Failed to join room:", error);
      }
    };

    joinRoom();
  }, []);

  const sendMessage = () => {
    if (room) {
      room.send("message", "Hello, clients!");
    }
  };

  return (
    <div className="container">
      <button onClick={sendMessage}>Send Message to All Clients</button>

      <div className="messages">
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sessionId}:</strong> {msg.message}
          </p>
        ))}
      </div>
    </div>
  );
}
