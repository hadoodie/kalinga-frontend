import { Ambulance, PackageOpen, MapPinHouse, UsersRound } from "lucide-react";
import { motion } from "framer-motion";

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4 relative bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        {/* Heading */}
        <motion.h2
          className="text-4xl md:text-4xl font-bold mb-5 text-center text-primary"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          May{" "}
          <span className="font-extrabold bg-gradient-to-r from-yellow-300 to-green-700 bg-clip-text text-transparent">
            KALINGA
          </span>{" "}
          para sa bawat pangangailangan
        </motion.h2>

        <motion.p
          className="mb-10 text-center text-primary"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Handang maghatid ng tulong at kaligtasan anumang oras at kahit saan ka man
          naroroon!
        </motion.p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: <Ambulance className="h-8 w-8 text-primary" />,
              title: (
                <>
                  Mabilis na Responde sa{" "}
                  <span className="text-highlight">tamang oras</span>
                </>
              ),
              text: "Maibibigay agad ang iyong mga pangangailangan—dahil ang iyong kaligtasan ang aming prioridad.",
            },
            {
              icon: <PackageOpen className="h-8 w-8 text-primary" />,
              title: (
                <>
                  <span className="text-highlight">Inuuna</span> namin ang iyong{" "}
                  <span className="text-highlight">pangangailangan</span>
                </>
              ),
              text: "May first aid kit na handang ibigay at pagkain at inumin para sa iyong kalusugan.",
            },
            {
              icon: <MapPinHouse className="h-8 w-8 text-primary" />,
              title: (
                <>
                  Nasaan ka man ay{" "}
                  <span className="text-highlight">abot-kamay ang tulong</span>
                </>
              ),
              text: "Sa tulong ng real-time tracking, madaling matutukoy ang iyong lokasyon—anumang oras, kahit saan.",
            },
            {
              icon: <UsersRound className="h-8 w-8 text-primary" />,
              title: (
                <>
                  <span className="text-highlight">Makipag-ugnayan</span> at{" "}
                  <span className="text-highlight">ipaalam</span> ang kalagayan
                </>
              ),
              text: "Iparating kung saan ka naroroon at kung ano ang iyong kailangan.",
            },
          ].map((box, i) => (
            <motion.div
              key={i}
              className="gradient-border p-6 card-hover"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  {box.icon}
                </div>
                <h4 className="font-bold text-lg">{box.title}</h4>
                <p className="text-muted-foreground">{box.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
