import { Tail } from "tail";
import dotenv from "dotenv";
import readline from "readline";
import { Rcon } from "rcon-client";

const env = dotenv.config().parsed as {
  RCON_HOST: string;
  RCON_PASSWORD: string;
  RCON_PORT: string;
};

if (!env.RCON_HOST || !env.RCON_PASSWORD) {
  throw Error("missing host / password");
}

const rcon = new Rcon({
  host: env.RCON_HOST,
  password: env.RCON_PASSWORD,
  port: env.RCON_PORT ? parseInt(env.RCON_PORT) : 27015,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rcon
  .connect()
  .then(async () => {
    console.log("Connected to CS:GO server via RCON");

    // Watch the CS:GO log file for changes
    const logTail = new Tail("cs2.log");
    logTail.on("line", (data: string) => {
      // Handle log data here, you can send it to the RCON or perform any other actions.
      console.log(data);
    });

    logTail.on("error", (error: Error) => {
      console.error("Error watching log file:", error);
    });

    function getUserInput() {
      rl.question("", async (input) => {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
        console.log(await rcon.send(input));
        getUserInput();
      });
    }
    getUserInput();
  })
  .catch((error: Error) => {
    console.error("Failed to connect to RCON:", error);
  });

process.on("SIGINT", () => {
  rcon.end();
  rl.close();
  console.log("Disconnected from CS:GO server via RCON");
  process.exit();
});

console.log("Press Ctrl+C to exit.");
