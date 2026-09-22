import { Suspense } from "react";

import { AccountNotifications } from "../shared/components/account-notifications";
import { HeroBanner } from "../shared/components/hero-banner";
import { Newsletter } from "../shared/components/newsletter-form";
import {
  ProductsGrid,
  ProductsGridSkeleton,
} from "../shared/components/products-grid";
import { HomeProvider } from "../shared/providers/home-provider";
import { type StandardHomeViewProps } from "../shared/types";
import { RichTextBlock, RichTextBlockProps } from "../shared/components/rich-text-block";

const richTextContent: RichTextBlockProps = {
  eyebrow: "¿Por qué comprar con nostros?",
  paragraphs: [
    {
      title: "Calidad garantizada",
      text: "Cada pieza es seleccionada cuidadosamente para ofrecerte broqueles de oro de 10k y 14k con la calidad que esperas. Trabajamos con oro auténtico y diseños pensados para conservar su belleza y acompañarte por mucho tiempo.",
    },
    {
      title: "Rápida entrega",
      text: "Preparamos y enviamos tu pedido lo antes posible para que disfrutes tus nuevos broqueles sin largas esperas. Además, podrás dar seguimiento a tu envío desde que sale con destino a tu domicilio.",
    },
    {
      title: "Devolución facil y garantizada",
      text: "Compra con tranquilidad. Si tu pedido no cumple con tus expectativas, contamos con un proceso de devolución sencillo y claro para brindarte seguridad antes, durante y después de tu compra.",
    },
  ],
  align: "center",
  width: "default",
  tone: "default",
};

/**
 * Standard view for the home page.
 * @param props - The properties for the home view.
 * @returns A React component rendering the standard home page.
 */
export const StandardHomeView = async ({
  mailTo,
  services,
  accessToken,
  paths,
  revalidateTime,
  region,
}: StandardHomeViewProps) => {
  return (
    <HomeProvider
      region={region}
      services={services}
      revalidateTime={revalidateTime}
      accessToken={accessToken}
      render={({ user, fields }) => (
        <section className="grid w-full content-start">
          <HeroBanner fields={fields} searchPath={paths.search} />
          <Suspense fallback={<ProductsGridSkeleton />}>
            <ProductsGrid
              region={region}
              fields={fields}
              services={services}
              productPath={paths.product}
              searchPath={paths.search}
              listId="home-products"
              listName="Home products"
            />
          </Suspense>
          <div>
            <AccountNotifications
              user={user}
              mailTo={mailTo}
              paths={{ home: paths.home, privacyPolicy: paths.privacyPolicy }}
            />
          </div>
          <div className="mb-8">
            <RichTextBlock {...richTextContent} />
          </div>
          <div className="mb-8">
            <Newsletter />
          </div>
        </section>
      )}
    />
  );
};
