import Image from "next/image";

export const metadata = {
  title: "About — Decision Journal",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-6 text-3xl font-bold text-brand-600">About</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Image
            src="/img/image-jon.png"
            alt="Jon Upchurch"
            width={150}
            height={225}
            className="rounded-card"
          />
        </div>

        <div className="sm:col-span-3">
          <section className="mb-8">
            <h2 className="mb-2 text-lg font-semibold">Who built this</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {/* TODO: replace with your real bio */}
              Hi, I&apos;m Jon Upchurch. This project is part of my work learning spec-driven
              development — planning a project in detail before writing code, then building it
              incrementally with an AI collaborator.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Get in touch</h2>
            <p className="text-gray-600 dark:text-gray-400">
              <a
                href="https://github.com/jonupchurch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 underline"
              >
                GitHub
              </a>{" "}
              &middot;{" "}
              <a
                href="https://www.linkedin.com/in/jonupchurch/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 underline"
              >
                LinkedIn
              </a>{" "}
              &middot;{" "}
              <a href="mailto:jonupchurch@gmail.com" className="text-brand-600 underline">
                jonupchurch@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Why Decision Journal</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {/* TODO: replace with your real motivation/background */}
          Everyone makes decisions, but almost nobody tracks whether their instincts were actually
          right afterward. This app is a small, personal tool for closing that loop.
        </p>
      </section>
    </main>
  );
}
