import { z } from "zod";
export const signupSchema=z.object({
  fullName:z.string().trim().min(3).max(100),
  email:z.string().email(),
  password:z.string().min(8).max(128),
  confirmPassword:z.string(),
  terms:z.literal(true),
  privacy:z.literal(true),
}).refine(x=>x.password===x.confirmPassword,{message:"Passwords do not match.",path:["confirmPassword"]});
