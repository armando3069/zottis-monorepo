export function LogoCloud() {
  const logos = [
    "Acme Corp",
    "TechFlow",
    "Verida",
    "NovaPay",
    "Cloudwise",
    "Orbitex",
  ];

  return (
    <section className="border-y border-gray-100 bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
          Used by modern teams
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
          {logos.map((name) => (
            <span
              key={name}
              className="text-[15px] font-semibold tracking-tight text-gray-300 transition-colors hover:text-gray-400 sm:text-[16px]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
