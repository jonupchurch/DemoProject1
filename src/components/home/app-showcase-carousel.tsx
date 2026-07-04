"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

export interface AppShowcaseFeature {
  title: string;
  body: string;
}

export interface AppShowcaseSlide {
  id: string;
  title: string;
  subtitle: string;
  /** CSS `background-image` URL. Falls back to `backgroundClassName` (a
   * gradient) when not supplied — swap in a real photo here later. */
  backgroundImage?: string;
  backgroundClassName?: string;
  features: AppShowcaseFeature[];
  cta?: ReactNode;
}

// A carousel with one slide per mini-app on this site (constitution's
// Multi-App Structure). Today there's only one real app (Decision Journal),
// so navigation chrome (arrows/dots) stays hidden and this renders as a
// plain single hero — it appears automatically once a second app exists.
const FEATURE_FADE_MS = 200;

export function AppShowcaseCarousel({ apps }: { apps: AppShowcaseSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: apps.length > 1 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [featuresVisible, setFeaturesVisible] = useState(true);
  const hasMultipleApps = apps.length > 1;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Feature cards fade out, swap to the new slide's content, then fade back
  // in — rather than an instant swap — as the carousel changes slides.
  useEffect(() => {
    if (selectedIndex === displayedIndex) return;
    setFeaturesVisible(false);
    const timeout = setTimeout(() => {
      setDisplayedIndex(selectedIndex);
      setFeaturesVisible(true);
    }, FEATURE_FADE_MS);
    return () => clearTimeout(timeout);
  }, [selectedIndex, displayedIndex]);

  const displayedApp = apps[displayedIndex] ?? apps[0];

  return (
    <section aria-label="Mini-app showcase">
      <div
        className="relative overflow-hidden rounded-card"
        role="region"
        aria-roledescription="carousel"
        aria-label="Mini apps"
        ref={emblaRef}
      >
        <div className="flex">
          {apps.map((app, index) => (
            <div
              key={app.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${apps.length}`}
              // `inert` (not just aria-hidden) on off-screen slides — embla
              // keeps every slide in the DOM, so an off-screen slide's own
              // links/buttons (e.g. its CTA) would otherwise stay
              // keyboard-focusable despite being visually scrolled away
              // (axe: aria-hidden-focus — same class of bug as the phase 3
              // calibration chart).
              inert={index !== selectedIndex}
              className="relative min-w-0 flex-[0_0_100%]"
            >
              <div
                className={`relative flex min-h-[22rem] flex-col items-center justify-center gap-6 overflow-hidden px-6 py-16 text-center ${
                  app.backgroundImage ? "" : (app.backgroundClassName ?? "bg-brand-700")
                }`}
              >
                {app.backgroundImage && (
                  <Image
                    src={app.backgroundImage}
                    alt=""
                    fill
                    priority={index === 0}
                    className="object-cover"
                  />
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10"
                  aria-hidden="true"
                />
                <div className="relative flex flex-col items-center gap-6">
                  <h1 className="text-4xl font-bold text-white sm:text-5xl">{app.title}</h1>
                  <p className="max-w-xl text-lg text-gray-100">{app.subtitle}</p>
                  {app.cta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMultipleApps && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous app"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-900 shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next app"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-900 shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {hasMultipleApps && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {apps.map((app, index) => (
            <button
              key={app.id}
              type="button"
              aria-label={`Show ${app.title}`}
              aria-current={index === selectedIndex ? "true" : undefined}
              onClick={() => emblaApi?.scrollTo(index)}
              // Lighthouse `target-size`: the visual dot is small, but the
              // clickable button itself is a full 24x24px touch target.
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  index === selectedIndex ? "bg-brand-600" : "bg-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <div
        className={`mt-12 grid gap-8 transition-opacity duration-200 ease-in-out sm:grid-cols-3 ${
          featuresVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {displayedApp.features.map((feature) => (
          <div key={feature.title} className="rounded-card border border-gray-200 p-6">
            <h2 className="mb-2 font-semibold">{feature.title}</h2>
            <p className="text-sm text-gray-600">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
