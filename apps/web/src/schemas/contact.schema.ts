import { INSTALLATION_SYSTEMS } from "@/lib/installation-systems";
import { z } from "zod";

export const CONTACT_TOPICS = ["ogled", "vapros"] as const;
export const CONTACT_SYSTEMS = [...INSTALLATION_SYSTEMS.map((system) => system.slug), "drugo"] as const;

/**
 * The contact and site-visit form, checked the same way in the browser (React Hook Form) and in the action.
 * Each message is the key of its text under `contact.errors`, so both sides show it in the visitor's language.
 */
export const contactSchema = z
  .object({
    topic: z.enum(CONTACT_TOPICS),
    system: z.union([z.enum(CONTACT_SYSTEMS), z.literal("")]),
    name: z.string().trim().min(1, "name").max(120, "name"),
    email: z.string().trim().max(200, "email").pipe(z.email("email")),
    phone: z.string().trim().max(40, "phone"),
    city: z.string().trim().max(100, "city"),
    message: z.string().trim().max(4000, "message"),
    consent: z.boolean().refine((given) => given, { message: "consent" }),
  })
  .superRefine((input, context) => {
    // A question needs a few words; a site-visit request can be just the contact details.
    if (input.topic === "vapros" && input.message.length < 3) {
      context.addIssue({ code: "custom", path: ["message"], message: "message" });
    }
  });

export type ContactInput = z.input<typeof contactSchema>;
export type ContactField = "name" | "email" | "message" | "consent";
