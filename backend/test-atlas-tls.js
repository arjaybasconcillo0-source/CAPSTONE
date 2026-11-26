import tls from "node:tls";

const hostname =
  "ac-wgv96on-shard-00-01.kcxyiv8.mongodb.net";

console.log("Testing TLS connection to:", hostname);

const socket = tls.connect({
  host: hostname,
  port: 27017,
  servername: hostname,
  minVersion: "TLSv1.2",
  rejectUnauthorized: true,
});

socket.setTimeout(10000);

socket.on("secureConnect", () => {
  console.log("TLS CONNECTION SUCCESSFUL");
  console.log("TLS Version:", socket.getProtocol());
  console.log("Certificate authorized:", socket.authorized);
  socket.destroy();
});

socket.on("error", (error) => {
  console.error("TLS CONNECTION FAILED");
  console.error("Code:", error.code);
  console.error("Message:", error.message);
});

socket.on("timeout", () => {
  console.error("TLS connection timed out");
  socket.destroy();
});
