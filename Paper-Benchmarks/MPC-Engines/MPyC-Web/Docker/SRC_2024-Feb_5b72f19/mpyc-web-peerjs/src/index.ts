import express, { Express, Request, Response } from "express";
import { ExpressPeerServer } from "peer";


const app = express();

app.get("/hello", (req: Request, res: Response) => res.send("Hello world!"));

const server = app.listen(9000);

const peerServer = ExpressPeerServer(server, {
    path: "/",
});

app.use("/peerjs", peerServer);
