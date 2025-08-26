import { Ambulance, PackageOpen, MapPinHouse, UsersRound } from "lucide-react";

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4 relative bg-green-950">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-4xl md:text-4xl font-bold mb-5 text-center text-white">
          May{" "}
          <span className="font-extrabold bg-gradient-to-r from-yellow-300 to-green-700 bg-clip-text text-transparent">
            KALINGA
          </span>{" "}
          para sa bawat pangangailangan
        </h2>
        <p className="mb-10 text-center text-white">
          Handang maghatid ng tulong at kaligtasan anumang oras at kahit saan ka man
          naroroon!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Box 1 */}
          <div className="gradient-border p-6 card-hover">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary/10 mb-4">
                <Ambulance className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg">
                Mabilis na Responde sa{" "}
                <span className="text-highlight">tamang oras</span>
              </h4>
              <p className="text-muted-foreground">
                Maibibigay agad ang iyong mga pangangailangan—dahil ang iyong
                kaligtasan ang aming prioridad.
              </p>
            </div>
          </div>

          {/* Box 2 */}
          <div className="gradient-border p-6 card-hover">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary/10 mb-4">
                <PackageOpen className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg">
                <span className="text-highlight">Inuuna</span> namin ang iyong{" "}
                <span className="text-highlight">pangangailangan</span>
              </h4>
              <p className="text-muted-foreground">
                May first aid kit na handang ibigay at pagkain at inumin para sa
                iyong kalusugan.
              </p>
            </div>
          </div>

          {/* Box 3 */}
          <div className="gradient-border p-6 card-hover">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary/10 mb-4">
                <MapPinHouse className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg">
                Nasaan ka man ay{" "}
                <span className="text-highlight">abot-kamay ang tulong</span>
              </h4>
              <p className="text-muted-foreground">
                Sa tulong ng real-time tracking, madaling matutukoy ang iyong
                lokasyon—anumang oras, kahit saan.
              </p>
            </div>
          </div>

          {/* Box 4 */}
          <div className="gradient-border p-6 card-hover">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary/10 mb-4">
                <UsersRound className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg">
                <span className="text-highlight">Makipag-ugnayan</span> at
                {" "}<span className="text-highlight">ipaalam</span> ang
                kalagayan
              </h4>
              <p className="text-muted-foreground">
                Iparating kung saan ka naroroon at kung ano ang iyong kailangan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
