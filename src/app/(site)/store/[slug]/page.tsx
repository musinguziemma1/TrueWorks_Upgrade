import type { Metadata } from "next";
import ProductDetail from "./content";

export const metadata: Metadata = {
  title: "Product",
  description: "View product details and purchase.",
};

export default function ProductDetailPage() {
  return <ProductDetail />;
}
