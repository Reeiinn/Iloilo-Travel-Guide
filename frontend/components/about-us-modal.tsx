import React from "react";
import Image from "next/image";

interface AboutUsModalProps {
  open: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ open, onClose }) => {
  const teamMembers = [
    {
      name: "Christopher Colomer",
      role: "Ultimate Developer",
      image: "/images/people/Christoper.jpg",
      alt: "Christopher Colomer",
    },
    {
      name: "Nikko Delos Santos",
      role: "Backend Developer",
      image: "/images/people/Nikko.jpg",
      alt: "Nikko Delos Santos",
    },
    {
      name: "Reinwel Tingson",
      role: "Front End Developer",
      image: "/images/people/reinwel.jpg",
      alt: "Reinwel Tingson",
    },
    {
      name: "Trisha Jambaro",
      role: "Project Manager",
      image: "/images/people/trisha.jpg",
      alt: "Trisha Jambaro",
    },
  ];

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl shadow-black/20 animate-in fade-in zoom-in-95 duration-300 sm:p-8 lg:p-10">
        <button
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-slate-100 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="mb-8 w-full">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">The people behind iLOcate</p>
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">Meet the Team</h2>
        </div>

        <section className="mb-10 w-full space-y-4">
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <article
                key={member.name}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg ring-1 ring-slate-200">
                  <Image
                    src={member.image}
                    alt={member.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{member.name}</h3>
                <p className="mt-1 text-sm font-medium uppercase tracking-wide text-primary/80">{member.role}</p>
              </article>
            ))}
          </div>
        </section>
        <div className="w-full max-w-2xl">
          <h3 className="mb-2 text-lg font-semibold sm:text-xl">Why we made this web app:</h3>
          <p className="text-center text-sm text-gray-700 sm:text-base">
            We created iLOcate to help locals and tourists discover the best places, food, and events in Iloilo City. Our goal is to make exploring Iloilo easy, fun, and accessible for everyone by providing a user-friendly platform with up-to-date information and personalized recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};
