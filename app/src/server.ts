
import "dotenv/config";

import app from "./app.js";
import {
  closeDatabase,
  initializeDatabase
} from "./shared/database/database.js";

const PORT = Number(process.env.PORT ?? 3000);

try {
  initializeDatabase();
} catch (error) {
  console.error("Failed to initialize the Igala Living Memory database.", error);
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received. Closing server and database.`);

  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

export default server;
