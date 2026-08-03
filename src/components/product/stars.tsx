import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number;
  className?: string;
  starClassName?: string;
}

export function Stars({ rating, className, starClassName }: StarsProps) {
  const rounded = Math.round(rating * 2) / 2; // Round to nearest 0.5
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.floor(rounded);
        const halfFilled = !filled && i < rounded;
        return (
          <div key={i} className="relative">
            <Star
              className={cn(
                "h-3.5 w-3.5 text-border",
                starClassName
              )}
            />
            {(filled || halfFilled) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : "50%" }}
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5 fill-accent text-accent",
                    starClassName
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
