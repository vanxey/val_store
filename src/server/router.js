import { readFileSync } from "node:fs";

export function route (req, res){
    const method = req.method;
    const url = req.url;

    if(method === "GET" && url === "/"){
        res.writeHead(200, {"content-type": "text/plain"});
        res.end("Valo store is live");
        return;
    }

    res.writeHead(400, {"content-type": "text/plain"});
    res.end("Content not found");
};