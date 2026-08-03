import { Stethoscope, Heart, Church, GraduationCap, Briefcase, Landmark } from "lucide-react";
import { AnimateOnScroll } from "./animate-on-scroll";

const sectors = [
  { name: "Hospitals & Clinics", icon: Stethoscope },
  { name: "NGOs & Non-profits", icon: Heart },
  { name: "Churches & Ministries", icon: Church },
  { name: "Schools & Colleges", icon: GraduationCap },
  { name: "SMEs & Startups", icon: Briefcase },
  { name: "Finance Teams", icon: Landmark },
];

export default function TrustedBy() {
  return (
    <section className="border-b border-border bg-white py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimateOnScroll>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Trusted by professionals across the Globe
          </p>
        </AnimateOnScroll>
        <AnimateOnScroll delay={150}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {sectors.map((sector) => (
              <div
                key={sector.name}
                className="flex items-center gap-2.5 text-muted/80 transition-colors hover:text-primary"
              >
                <sector.icon className="h-5 w-5 text-primary/50" />
                <span className="text-sm font-semibold tracking-wide">{sector.name}</span>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
