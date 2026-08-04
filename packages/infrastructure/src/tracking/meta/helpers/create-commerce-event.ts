type MetaContent = {
  id: string;
  item_price: number;
  quantity: number;
};

export type MetaCommerceEvent = {
  content_ids: string[];
  content_name?: string;
  content_type: "product";
  contents: MetaContent[];
  coupon?: string;
  currency: string;
  value: number;
};

export const createMetaCommerceEvent = ({
  currency,
  value,
  items,
  coupon,
  contentName,
}: {
  contentName?: string;
  coupon?: string;
  currency: string;
  items: MetaContent[];
  value: number;
}): MetaCommerceEvent => ({
  currency,
  value,

  content_type: "product",

  content_ids: items.map((item) => item.id),

  contents: items,

  ...(contentName
    ? {
        content_name: contentName,
      }
    : {}),

  ...(coupon
    ? {
        coupon,
      }
    : {}),
});
