import { motion } from "framer-motion";

export const MissionSection = () => {
  return (
    <section
      id="mission"
      className="py-20 px-6 md:py-28 md:px-8 relative bg-green-950 text-white"
    >
      <div className="container mx-auto max-w-5xl text-left">
        <motion.h3
          className="text-lg sm:text-xl md:text-3xl text-white mb-3 font-medium"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Our
        </motion.h3>

        <motion.h1
          className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold mb-6 md:mb-8 leading-tight"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          MISSION
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg md:text-xl text-justify leading-relaxed text-gray-200 max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <span className="font-bold">
            Sa{" "}
            <span className="text-lg sm:text-xl md:text-2xl font-extrabold bg-gradient-to-r from-yellow-300 to-green-700 bg-clip-text text-transparent">
              KALINGA
            </span>
            , handa tayo sa anumang sakuna. Isang tap lang ang kailangan — kami
            na ang bahala sa mabilis at maasahang serbisyong medikal.
          </span>
        </motion.p>

        <br />

        <motion.p
          className="text-base sm:text-lg md:text-xl text-justify leading-relaxed text-gray-200 max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          Mabilisang serbisyo, dekalidad na doktor, at agarang pagtugon sa
          pangangailangan. Mula botika hanggang kagamitan, kalakip ang tamang
          kaalamang medikal para sa bawat Pilipino, saan mang panig ng bansa,
          anumang oras.
        </motion.p>
      </div>
    </section>
  );
};
