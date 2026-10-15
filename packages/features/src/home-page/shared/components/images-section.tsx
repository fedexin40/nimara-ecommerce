
import type { PageField } from "@nimara/domain/objects/CMSPage";
import { Skeleton } from "@nimara/ui/components/skeleton";

import { createFieldsMap, type FieldsMap } from "../utils/create-fields-map";
import {
  ImagesSectionClient,
  type ImageSectionItem,
} from "./images-section-client";

export interface ImagesSectionProps {
  fields: PageField[] | undefined;
}

export const ImagesSection = ({ fields }: ImagesSectionProps) => {
  if (!fields?.length) {
    return null;
  }

  const fieldsMap: FieldsMap = createFieldsMap(fields);

  const header = fieldsMap["homepage-image-section-header"]?.text;
  const headerFontColor =
    fieldsMap["homepage-image-section-header-font-color"]?.text;

  const images: ImageSectionItem[] = [];

  for (let index = 1; ; index++) {
    const image =
      fieldsMap[`homepage-image-section-image-${index}`]?.imageUrl;

    if (!image) {
      break;
    }

    const buttonText =
      fieldsMap[`homepage-image-section-button-text-${index}`]?.text;

    const href =
      fieldsMap[`homepage-image-section-button-href-${index}`]?.text;


    if (buttonText && href) {
      images.push({
        image,
        buttonText,
        href,
      });
    }
  }

  if (!images.length) {
    return null;
  }

  return (
    <ImagesSectionClient
      header={header}
      headerFontColor={headerFontColor}
      images={images}
    />
  );
};

export const ImagesSectionSkeleton = () => {
  return (
    <section className="mb-12">
      <Skeleton className="mb-6 h-8 w-64" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="aspect-square w-full rounded-md"
          />
        ))}
      </div>
    </section>
  );
};
