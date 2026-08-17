"use client";

import { Bot, MessageCircle } from "lucide-react";
import { useState } from "react";
import { SiMessenger, SiWhatsapp } from "react-icons/si";

export const ContactFloating = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Botones secundarios */}
      <div
        className={`flex flex-col items-end gap-3 transition-all duration-300 ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {/* WhatsApp */}
        <a
          href="https://api.whatsapp.com/send?phone=522881011401"
          target="_blank"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110"
        >
          <SiWhatsapp size={22} />
        </a>

        {/* Messenger */}
        <a
          href="https://m.me/61571068417335"
          target="_blank"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0084FF] text-white shadow-lg transition hover:scale-110"
        >
          <SiMessenger size={22} />
        </a>
      </div>

      {/* Botón principal */}
      <button
        aria-label="Open Chat"
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-xl transition hover:scale-110"
      >
        <MessageCircle />
      </button>
    </div>
  );
};
