import { cfg } from "./config.js";
import { createServer } from "./server.js";

const { server } = createServer();
server.listen(cfg.port, () => {
  console.log(`api on :${cfg.port}`);
});
