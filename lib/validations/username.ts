import { z } from "zod";
export const RESERVED_USERNAMES=["admin","administrator","support","help","psfit","official","settings","login","signup","api","community","dashboard","explore","activity","notifications","security"];
export const usernameSchema=z.string().trim().toLowerCase().min(3).max(30)
  .regex(/^[a-z0-9_]+(?:\.[a-z0-9_]+)*$/,"Use letters, numbers, dots, and underscores. Dots cannot repeat or appear at the ends.")
  .refine(value=>!RESERVED_USERNAMES.includes(value),"This nickname is reserved.");
