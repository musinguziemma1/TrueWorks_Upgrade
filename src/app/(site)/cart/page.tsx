import type { Metadata } from "next";
import CartContent from "./content";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review the templates in your cart and proceed to secure checkout.",
};

export default function CartPage() {
  return <CartContent />;
}
