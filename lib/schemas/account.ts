import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use a password of at least eight characters.")
    .max(72, "Use a password of at most seventy-two characters."),
});

export type Credentials = z.infer<typeof credentialsSchema>;
