import { Port } from "../domain/Port";
import { Tunnel } from "../domain/Tunnel";
import { Metro } from "../domain/Metro";
import { MetroNode } from "../domain/MetroNode";
import { Vector3, Euler } from "three";

// creating our own metro
export function createMetro() {
  const station1 = new MetroNode(new Vector3(0, 0, 0));
  const station2 = new MetroNode(new Vector3(140, 0, 10));

  const station1Port1 = new Port(new Vector3(-1, 0, -1), new Euler(0, 0, 0), station1, "to");
  const station1Port2 = new Port(new Vector3(1, 0, -1), new Euler(0, 0, 0), station1, "from", [station1Port1]);

  const station2Port1 = new Port(new Vector3(-1, 0, 0), new Euler(0, 0, 0), station2, "to");

  const points = [new Vector3(10, 0, 3), new Vector3(20, 0.5, 10), new Vector3(40, 1, 13), new Vector3(50, 1, 15), new Vector3(70, 0, 7)];

  const metro = new Metro();
  const junction = metro.addJunction(new Vector3(160, 3, 10), 0, [
    { x: 0, z: 0, yRotation: 0, type: "to" },
    { x: 30, z: 5, yRotation: 0, type: "from" },
    { x: 30, z: -25, yRotation: Math.PI / 6, type: "from" },
  ]);

  const tunnel1 = new Tunnel(
    station1Port2,
    junction.ports.find((port) => port.type == "to"),
    points,
  );

  const tunnel2 = new Tunnel(
    junction.ports.find((port) => port.type == "from"),
    station2Port1,
    [],
  );
  metro.ports.push(station1Port1, station1Port2, station2Port1);
  metro.nodes.push(station1, station2);
  metro.tunnels.push(tunnel1, tunnel2);

  return metro;
}
