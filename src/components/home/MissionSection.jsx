export const MissionSection = () => {
  return (
    <section
      id="mission"
      className="py-20 px-6 md:py-28 md:px-8 relative bg-green-950 text-white"
    >
      <div className="container mx-auto max-w-5xl text-left">
        <h3 className="text-lg sm:text-xl md:text-3xl text-white mb-3 font-medium">
          Our
        </h3>
        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold mb-6 md:mb-8 leading-tight">
          MISSION
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-justify leading-relaxed text-gray-200 max-w-3xl">
          <span className="font-bold">
            Sa{" "}
            <span className="text-lg sm:text-xl md:text-2xl font-extrabold bg-gradient-to-r from-yellow-300 to-green-700 bg-clip-text text-transparent">
              KALINGA
            </span>
            , handa tayo sa anumang sakuna. Isang tap lang ang kailangan — kami
            na ang bahala sa mabilis at maasahang serbisyong medikal.
          </span>
        </p>
        <br />
        <p className="text-base sm:text-lg md:text-xl text-justify leading-relaxed text-gray-200 max-w-3xl">
          Mabilisang serbisyo, de-kalidad na doktor, at agarang pagtugon sa
          pangangailangan. Mula botika hanggang kagamitan, kalakip ang tamang
          kaalamang medikal para sa bawat Pilipino, saan mang panig ng bansa,
          anumang oras.
        </p>
      </div>
    </section>
  );
};
