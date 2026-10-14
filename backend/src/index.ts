import { env } from "@/lib/env";
import { createApp } from "@/app";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Hamraz backend listening on port ${env.port} (${env.nodeEnv})`);
});
