"use client";

import { CityCanvas } from "@/components/city/CityCanvas";

export function CenterStage() {
  return (
    <section className="relative h-full w-full overflow-hidden">
      <div className="relative h-full w-full">
        <CityCanvas />
      </div>
    </section>
  );
}
