import { env } from "./env";
import { harakumo } from "./harakumo";

export function aiEnabled(): boolean { return Boolean(harakumo()) && env.harakumoAiEnabled; }

/** Asks the Harakumo AI gateway (model "auto") for serving/recipe ideas for a fruit. */
export async function recipeIdeas(productName: string, origin?: string | null): Promise<{ output: string; model: string; cost: number } | null> {
  const hk = harakumo();
  if (!hk || !env.harakumoAiEnabled) return null;
  const res = await hk.ai.generate({
    model: "auto",
    prompt: `You are a friendly produce expert at a fresh fruit shop. In 4 short bullet points, give practical tips for "${productName}"${origin ? ` (from ${origin})` : ""}: how to pick/ripen it, how to store it, one quick recipe idea, and one fun fact. Keep it under 120 words.`,
  });
  return { output: res.output, model: res.model, cost: res.cost };
}
