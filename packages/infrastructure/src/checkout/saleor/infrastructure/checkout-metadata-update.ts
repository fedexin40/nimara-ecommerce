
import { err, ok } from "@nimara/domain/objects/Result";
import { graphqlClient } from "#root/graphql/client";
import { handleMutationErrors } from "../../../error";
import type { SaleorCheckoutServiceConfig } from "../../types";
import { CheckoutMetadataUpdateMutationDocument } from "../graphql/mutations/generated";


type MetadataInput = {
  key: string;
  value: string;
};

type CheckoutMetadataUpdateInfra = (
  input: {
    id: string;
    metadata: MetadataInput[];
  },
) => Promise<
  | ReturnType<typeof ok<{ success: true }>>
  | ReturnType<typeof err>
>;

export const saleorCheckoutMetadataUpdateInfra =
  ({
    apiURL,
    logger,
  }: SaleorCheckoutServiceConfig): CheckoutMetadataUpdateInfra =>
  async ({ id, metadata }) => {
    if (!metadata.length) {
      return ok({ success: true });
    }

    const result = await graphqlClient(apiURL).execute(
      CheckoutMetadataUpdateMutationDocument,
      {
        variables: {
          id,
          input: metadata,
        },
        operationName: "CheckoutMetadataUpdateMutation",
      },
    );

    if (!result.ok) {
      logger.error("Failed to update checkout metadata", {
        errors: result.errors,
        id,
      });

      return result;
    }

    const errors = result.data?.updateMetadata?.errors;

    if (errors?.length) {
      logger.error("Failed to update checkout metadata", {
        errors,
        id,
      });

      return err(handleMutationErrors(errors));
    }

    return ok({ success: true });
  };
