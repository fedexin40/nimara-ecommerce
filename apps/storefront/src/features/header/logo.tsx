import Image from "next/image";
import { useTranslations } from "next-intl";

import { LocalizedLink } from "@nimara/i18n/routing";

import logo from "@/assets/logo.png";
import { paths } from "@/foundation/routing/paths";

export const Logo = () => {
  const t = useTranslations("common");

  return (
    <LocalizedLink
      href={paths.home.asPath()}
      title={t("go-to-homepage")}
      aria-label={t("logo")}
    >
      <Image
        src={logo}
        alt="Logo"
        width={160}
        height={40}
        className="dark:invert"
        loading="eager"
      />
    </LocalizedLink>
  );
};

Logo.displayName = "Logo";
