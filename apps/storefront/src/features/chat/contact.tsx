"use client";

import { Bot, MessageCircle } from "lucide-react";
import { useState } from "react";
import { SiMessenger, SiWhatsapp } from "react-icons/si";

export const ContactFloating = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* WhatsApp */}
      <a
        href="https://api.whatsapp.com/send?phone=522881011401"
        target="_blank"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110"
      >
        <SiWhatsapp size={22} />
      </a>
    </div>
  );
};
