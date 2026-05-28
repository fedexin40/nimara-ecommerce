import Stripe from "stripe";

export const stripe_secret_key = new Stripe(process.env.STRIPE_SECRET_KEY!)
