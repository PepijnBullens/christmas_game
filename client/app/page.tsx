"use client";

import { Client, Room } from "colyseus.js";
import { useEffect, useState, useRef } from "react";
import Matter from "matter-js";

const Game = () => {
  const [room, setRoom] = useState<Room<any> | null>(null);
  const [restart, setRestart] = useState(false);

  const sceneRef = useRef(null);
  const engine = Matter.Engine.create();
  const world = engine.world;

  let player: Matter.Body | null = null;
  let opponent: Matter.Body | null = null;

  const COLYSEUS_SERVER = "ws://localhost:2567";
  const GAME_ROOM = "game_room";
  const client = new Client(COLYSEUS_SERVER);

  useEffect(() => {
    const joinRoom = async () => {
      try {
        const joinedRoom = await client.joinOrCreate(GAME_ROOM);
        console.log("Joined room:", joinedRoom);

        joinedRoom.onMessage("client_left", (data) => {
          console.log("client_left", data);

          if (opponent) {
            Matter.World.remove(world, opponent);
            opponent = null;
          }

          if (player) {
            Matter.World.remove(world, player);
            player = null;
          }

          setRestart(true);
        });

        joinedRoom.onMessage("opponent_position", (data) => {
          console.log("Opponent position:", data);

          if (opponent) {
            Matter.Body.setPosition(opponent, { x: data.x, y: data.y });
            opponent.render.fillStyle = "blue";
          }
        });

        joinedRoom.onMessage("setup", (data) => {
          player = Matter.Bodies.circle(
            data.player.x,
            data.player.y,
            data.player.size
          );
          player.render.fillStyle = "red";

          Matter.World.add(world, player);

          opponent = Matter.Bodies.circle(
            data.screen.width / 2,
            data.screen.height / 2,
            data.player.size
          );
          opponent.render.fillStyle = "white";

          Matter.World.add(world, opponent);

          if (data.opponent.playerId !== undefined) {
            Matter.Body.setPosition(opponent, {
              x: data.opponent.x,
              y: data.opponent.y,
            });
            opponent.render.fillStyle = "blue";
          }

          const render = Matter.Render.create({
            element: sceneRef.current || undefined,
            engine: engine,
            options: {
              width: data.screen.width,
              height: data.screen.height,
              wireframes: false, // Set to true for debugging
            },
          });

          // Disable gravity
          engine.gravity.y = 0;

          // Run the engine and renderer
          const runner = Matter.Runner.create();
          Matter.Runner.run(runner, engine);
          Matter.Render.run(render);

          // Clean up on component unmount
          return () => {
            Matter.Render.stop(render);
            Matter.Engine.clear(engine);
            render.canvas.remove();
            render.textures = {};
          };
        });

        setRoom(joinedRoom);
      } catch (error) {
        console.error("Failed to join room:", error);
      }
    };

    joinRoom();

    return () => {
      if (room) {
        room.leave();
      }
    };
  }, []);

  const requestPlayerMovement = (x: number, y: number) => {
    if (room) {
      room.send("update_velocity", { x, y });
    }
  };

  const speed = 5;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
        case "w":
          requestPlayerMovement(0, -speed);
          break;
        case "ArrowDown":
        case "s":
          requestPlayerMovement(0, speed);
          break;
        case "ArrowLeft":
        case "a":
          requestPlayerMovement(-speed, 0);
          break;
        case "ArrowRight":
        case "d":
          requestPlayerMovement(speed, 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [room]);

  return (
    <div className="container" ref={sceneRef}>
      {room ? (
        <p className="room-information">Connected to room: {room.id}</p>
      ) : (
        <p>Connecting...</p>
      )}
      {restart && (
        <div className="restart">
          <p>Oops... a player disconnected. </p>
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
          >
            Search for new lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;
