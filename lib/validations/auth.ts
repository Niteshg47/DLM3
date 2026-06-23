import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const magicLinkSchema = z.object({
  email: z.string().email(),
});

export const onboardingSchema = z.object({
  name: z.string().min(2).max(100),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  themeSlug: z.enum([
    "OCEAN_TEAL",
    "ROYAL_BLUE",
    "EMERALD_DENT",
    "INDIGO_PREMIUM",
    "RUBY_CARE",
    "CHARCOAL_TECH",
    "VIOLET_GLOW",
    "AMBER_WARM",
    "SKY_FRESH",
    "MAROON_CLASSIC",
  ]),
  logoUrl: z.string().url().optional().nullable(),
});

export const tenantSettingsSchema = z.object({
  name: z.string().min(2).max(100),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  themeSlug: z.enum([
    "OCEAN_TEAL",
    "ROYAL_BLUE",
    "EMERALD_DENT",
    "INDIGO_PREMIUM",
    "RUBY_CARE",
    "CHARCOAL_TECH",
    "VIOLET_GLOW",
    "AMBER_WARM",
    "SKY_FRESH",
    "MAROON_CLASSIC",
  ]),
  logoUrl: z.string().url().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  customDomain: z.string().url().optional().nullable(),
  whatsappEnabled: z.boolean(),
});
