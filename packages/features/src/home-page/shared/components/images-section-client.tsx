
"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { LocalizedLink } from "@nimara/i18n/routing";
import { Button } from "@nimara/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@nimara/ui/components/carousel";

export type ImageSectionItem = {
  image: string;
  buttonText: string;
  href: string;
};

type ImagesSectionClientProps = {
  header?: string;
  headerFontColor?: string;
  images: ImageSectionItem[];
};

export const ImagesSectionClient = ({
  header,
  images,
}: ImagesSectionClientProps) => {
  if (!images.length) {
    return null;
  }

  const renderImage = (item: ImageSectionItem) => (
    <div className="relative aspect-square w-full overflow-hidden">
      <Image
        src={item.image}
        alt={item.buttonText}
        fill
        sizes="(max-width: 639px) 67vw, 33vw"
        className="object-cover"
        loading="lazy"
        quality={75}
      />

      <Button
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        variant="outline"
        asChild
      >
        <LocalizedLink href={item.href}>
          {item.buttonText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </LocalizedLink>
      </Button>
    </div>
  );

  return (
    <section className="mb-12">
      {header && (
        <h2 className="text-foreground mb-6 text-xl font-semibold">
          {header}
        </h2>
      )}

      {/* Mobile: Carousel */}
      <Carousel className="sm:hidden">
        <CarouselContent>
          {images.map((item, index) => (
            <CarouselItem
              key={`${item.href}-${index}`}
              className="w-2/3 flex-none"
            >
              {renderImage(item)}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Desktop: Grid */}
      <div className="hidden grid-cols-3 gap-4 sm:grid">
        {images.map((item, index) => (
          <div key={`${item.href}-${index}`}>
            {renderImage(item)}
          </div>
        ))}
      </div>
    </section>
  );
};
