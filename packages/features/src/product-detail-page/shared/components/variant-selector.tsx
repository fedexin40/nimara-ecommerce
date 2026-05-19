"use client";

import { useTranslations } from "next-intl";

import { type Cart } from "@nimara/domain/objects/Cart";
import {
  type Product,
  type ProductAvailability,
} from "@nimara/domain/objects/Product";
import { Price } from "@nimara/features/shared/product/price";
import { Label } from "@nimara/ui/components/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@nimara/ui/components/toggle-group";
import { cn } from "@nimara/ui/lib/utils";

import { useVariantSelection } from "../hooks/useVariantSelection";
import { type AddToBagAction } from "../types";
import { AddToBag } from "./add-to-bag";
import { StickyBar } from "./sticky.bar";
import { VariantDropdown } from "./variant-dropdown";


type VariantSelectorProps = {
  addToBagAction: AddToBagAction;
  cart: Cart | null;
  cartPath: string;
  product: Product;
  productAvailability: ProductAvailability;
};

export const VariantSelector = ({
  product,
  productAvailability,
  cart,
  cartPath,
  addToBagAction,
}: VariantSelectorProps) => {
  const t = useTranslations();
  const marketplaceEnabled =
    process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED !== "false";
  const {
    allSelectionAttributes,
    areAllRequiredSelectionAttributesChosen,
    chosenAttributes,
    chosenVariant,
    chosenVariantAvailability,
    discriminatedVariantId,
    isChosenVariantAvailable,
    matchingVariants,
    params,
    setDiscriminatedVariantId,
    setParams,
    startPrice,
    variantsAvailability,
  } = useVariantSelection({ cart, product, productAvailability });

  const hasFreeVariant = variantsAvailability?.some(
    (variant) => variant.price.amount === 0,
  );

  const singleVariant =
    product.variants?.length === 1 ? product.variants[0] : null;

  const selectedVariantId = singleVariant
    ? singleVariant.id
    : matchingVariants?.length > 1
      ? discriminatedVariantId
      : chosenVariant
        ? chosenVariant.id
        : areAllRequiredSelectionAttributesChosen
          ? "NOTIFY_ME"
          : "";

  const selectedVariantAvailable = singleVariant
    ? true
    : matchingVariants?.length > 1
      ? true
      : chosenVariant
        ? isChosenVariantAvailable
        : areAllRequiredSelectionAttributesChosen
          ? false
          : true;

  return (
    <>
      <p className="py-4 text-lg font-semibold text-left">
        <Price
          price={chosenVariantAvailability?.price}
          startPrice={startPrice}
          hasFreeVariants={hasFreeVariant}
          undiscountedPrice={chosenVariantAvailability?.priceUndiscounted}
        />
      </p>

      {!singleVariant && (
        <div className="[&>div]:pb-4">
          {allSelectionAttributes.map(({ slug, name, values, type }, index) => {
            const isPreviousAttributeSelected =
              index === 0 ? true : !!chosenAttributes[index - 1]?.value;

            const chosenAttribute = chosenAttributes.find((val) => {
              if (val?.slug === slug) {
                return values.some((v) => v.slug === val.value);
              }

              return false;
            });

            return (
              <div key={slug} className="flex flex-col gap-1.5">
                <Label id={`label-${slug}`} className="text-foreground">
                  {name}
                  {type === "SWATCH" &&
                    !!chosenAttribute?.value &&
                    `: ${chosenAttribute.value}`}
                </Label>

                <ToggleGroup
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  value={
                    !chosenAttribute?.value ? null : chosenAttribute?.value
                  }
                  type="single"
                  disabled={!isPreviousAttributeSelected}
                  className={cn(
                    type === "SWATCH"
                      ? "flex justify-start"
                      : "grid grid-cols-2 md:grid-cols-3",
                  )}
                  aria-labelledby={t("products.label-slug", { slug })}
                  onValueChange={(valueSlug) => {
                    setDiscriminatedVariantId("");
                    setParams({
                      ...params,
                      [slug]: valueSlug,
                    }).catch((e) => {
                      console.error(e);
                    });
                  }}
                >
                  {values
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(({ slug: valueSlug, name: valueName, value }) => {
                      const isSelected = chosenAttributes.some(
                        (attr) =>
                          attr?.slug === slug && attr?.value === valueSlug,
                      );

                      return type === "SWATCH" ? (
                        <ToggleGroupItem
                          disabled={!isPreviousAttributeSelected}
                          variant="default"
                          key={valueSlug}
                          value={valueSlug}
                          className={cn(
                            "flex max-w-min flex-col hover:bg-transparent data-[state=on]:bg-transparent",
                            !isPreviousAttributeSelected && "opacity-50",
                          )}
                          size="default"
                        >
                          <div
                            className="h-6 w-6 border border-stone-200"
                            style={{
                              backgroundColor: value,
                            }}
                          />

                          <div
                            className={cn(
                              "invisible mt-1 h-[2px] w-6 bg-foreground",
                              isSelected && "visible",
                            )}
                          />
                        </ToggleGroupItem>
                      ) : (
                        <ToggleGroupItem
                          disabled={!isPreviousAttributeSelected}
                          variant="outline"
                          key={valueSlug}
                          value={valueSlug}
                        >
                          {valueName}
                        </ToggleGroupItem>
                      );
                    })}
                </ToggleGroup>
              </div>
            );
          })}

          {matchingVariants?.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <VariantDropdown
                variants={matchingVariants}
                onVariantSelect={(variantId) => {
                  setDiscriminatedVariantId(variantId);
                }}
                selectedVariantId={discriminatedVariantId}
              />
            </div>
          )}
        </div>
      )}

      <AddToBag
        cart={marketplaceEnabled ? cart : null}
        cartPath={cartPath}
        productVendorId={marketplaceEnabled ? (product.vendorId ?? null) : null}
        variantId={selectedVariantId}
        isVariantAvailable={selectedVariantAvailable}
        addToBagAction={addToBagAction}
      />

      {/* Trust Signals */}
      <div className="flex items-center justify-center gap-6 pt-5 text-xs">
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path d="M9 22V12h6v10" />
          </svg>
          Envío gratis en compras mayores de $1500 MXN
        </span>
      </div>

      <StickyBar
        price={startPrice.amount + " " + startPrice.currency}
        productName={product.name}
      >
        <AddToBag
          cart={marketplaceEnabled ? cart : null}
          cartPath={cartPath}
          productVendorId={
            marketplaceEnabled ? (product.vendorId ?? null) : null
          }
          variantId={selectedVariantId}
          isVariantAvailable={selectedVariantAvailable}
          addToBagAction={addToBagAction}
        />
      </StickyBar>
    </>
  );
};
