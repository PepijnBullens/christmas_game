"use client";

import { Client, Room } from "colyseus.js";
import { useEffect, useState, useRef } from "react";
import Matter from "matter-js";

const Game = () => {
  const [room, setRoom] = useState<Room<any> | null>(null);
  const [restart, setRestart] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

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

        joinedRoom.onMessage("update_players", (data) => {
          data.map((playerData: any) => {
            if (playerData.playerId !== joinedRoom.sessionId) {
              if (player) {
                Matter.Body.setPosition(player, {
                  x: playerData.x,
                  y: playerData.y,
                });
              }
            } else {
              if (opponent) {
                Matter.Body.setPosition(opponent, {
                  x: playerData.x,
                  y: playerData.y,
                });
              }
            }
          });
        });

        joinedRoom.onMessage("opponent_position", (data) => {
          if (opponent) {
            Matter.Body.setPosition(opponent, { x: data.x, y: data.y });
            opponent.render.fillStyle = "blue";
            opponent.render.visible = true;
            setGameStarted(true);
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

          if (data.opponent.playerId !== undefined) {
            opponent = Matter.Bodies.circle(
              data.opponent.x,
              data.opponent.y,
              data.player.size
            );
            opponent.render.fillStyle = "blue";
            setGameStarted(true);
          } else {
            opponent = Matter.Bodies.circle(
              data.screen.width / 2,
              data.screen.height / 2,
              data.player.size,
              { isSensor: true }
            );
            opponent.render.visible = false;
          }

          Matter.World.add(world, opponent);

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

          joinedRoom.onMessage("client_left", (data) => {
            if (opponent) {
              Matter.World.remove(world, opponent);
              opponent = null;
            }

            if (player) {
              Matter.World.remove(world, player);
              player = null;
            }

            Matter.Render.stop(render);
            Matter.Engine.clear(engine);
            render.canvas.remove();
            render.textures = {};

            setRestart(true);
          });

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
    if (room && gameStarted) {
      room.send("request_player_movement", { x, y });
    }
  };

  useEffect(() => {
    if (gameStarted) {
      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case "ArrowUp":
          case "w":
            requestPlayerMovement(0, -1);
            break;
          case "ArrowDown":
          case "s":
            requestPlayerMovement(0, 1);
            break;
          case "ArrowLeft":
          case "a":
            requestPlayerMovement(-1, 0);
            break;
          case "ArrowRight":
          case "d":
            requestPlayerMovement(1, 0);
            break;
          default:
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [gameStarted]);

  return (
    <div className="container" ref={sceneRef}>
      {room ? (
        <p className="room-information">
          Connected to room: {room.id}.<br />
          Game {gameStarted ? "has" : "has not"} started.
        </p>
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