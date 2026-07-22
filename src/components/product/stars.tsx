import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number;
  className?: string;
  starClassName?: string;
}

export function Stars({ rating, className, starClassName }: StarsProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.floor(rating) ? "fill-accent text-accent" : "fill-border text-border",
            starClassName
          )}
        />
      ))}
    </div>
  );
}
