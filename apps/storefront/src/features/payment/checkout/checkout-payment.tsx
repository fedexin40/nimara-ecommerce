"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";

import {
  type AppErrorCode,
  type BaseError,
} from "@nimara/domain/objects/Error";
import { type PaymentMethod } from "@nimara/domain/objects/Payment";
import { useRouter } from "@nimara/i18n/routing";
import { RadioGroup, RadioGroupItem } from "@nimara/ui/components/radio-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@nimara/ui/components/tabs";
import { useToast } from "@nimara/ui/hooks";
import { cn } from "@nimara/ui/lib/utils";

import { PaymentMethods } from "@/features/checkout/payment-methods";
import { usePaymentData } from "@/features/payment/hooks/use-payment-data";
import { isGlobalError } from "@/foundation/errors/errors";

import { updateBillingAddress } from "./actions";
import { BillingAddressSection } from "./components/billing-address-section";
import { NewPaymentMethodSection } from "./components/new-payment-method-section";
import { PlaceOrderButton } from "./components/place-order-button";
import { usePaymentForm } from "./hooks/use-payment-form";
import { usePaymentSubmit } from "./hooks/use-payment-submit";
import { PayPalPayment } from "./paypal";
import { type BillingAddressPath, type PaymentSchema } from "./schema";
import { type TabName } from "./tabs/address-tab";
import { type CommonPaymentProps } from "./types";

type PaymentProvidersType = "stripe" | "paypal";

type CheckoutPaymentProps = CommonPaymentProps & {
  paymentGatewayMethods: PaymentMethod[];
};

/**
 * The standard checkout payment: a Saleor transaction backs the payment,
 * with saved payment methods offered next to the new-method element.
 */
export const CheckoutPayment = ({
  addressFormRows,
  checkout,
  countries,
  countryCode,
  errorCode,
  formattedAddresses,
  paymentGatewayMethods,
  storeUrl,
  user,
}: CheckoutPaymentProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [errors, setErrors] = useState<AppErrorCode[]>(
    errorCode ? [errorCode] : [],
  );
  const [PaymentProvider, setPaymentProvider] = useState<
    PaymentProvidersType | undefined
  >(undefined);
  const hasSavedPaymentMethods = paymentGatewayMethods.length > 0;
  const [paymentMethodTab, setPaymentMethodTab] = useState<TabName>(
    hasSavedPaymentMethods ? "saved" : "new",
  );
  const {
    initializeData,
    initializeGateway,
    initializeTransaction,
    setTransactionData,
    transactionData,
  } = usePaymentData({
    onErrors: setErrors,
  });
  const elementsRef = useRef<unknown>(null);

  const defaultPaymentMethod =
    paymentGatewayMethods.find(({ isDefault }) => isDefault)?.token ??
    paymentGatewayMethods[0]?.token;

  const {
    addressActiveTab,
    form,
    isCountryChanging,
    paymentMethod,
    sameAsShippingAddress,
    saveForFutureUse,
    setAddressActiveTab,
    setIsCountryChanging,
  } = usePaymentForm({
    addressFormRows,
    checkout,
    countries,
    countryCode,
    defaultPaymentMethod,
    errorCode,
    formattedAddresses,
    user,
  });

  const hasSelectedPaymentMethod = !!paymentMethod;
  const isAddingNewPaymentMethod = paymentMethodTab === "new";
  /**
   * The gateway SDK is booted from a session, so paying with a stored method —
   * which opens its session on submit — is ready before the SDK exists.
   */
  const isReady = isAddingNewPaymentMethod ? !!initializeData : true;
  const isLoading = !isReady || isProcessing;
  const canProceed =
    !isLoading &&
    (isAddingNewPaymentMethod ? isMounted : hasSelectedPaymentMethod);

  /**
   * Paying with a stored method asks the payment app for an intent bound to
   * that method, which the payment is then confirmed against. The intent is
   * confirmed directly, so the mounted payment element keeps its own.
   */
  const resolveTransactionData = async ({
    paymentMethod,
    saveForFutureUse,
  }: PaymentSchema) => {
    if (!isAddingNewPaymentMethod && paymentMethod) {
      const data = await initializeTransaction({
        id: checkout.id,
        amount: checkout.totalPrice.gross.amount,
        paymentMethodId: paymentMethod,
        saveForFutureUse,
      });

      if (!data) {
        router.refresh();

        return undefined;
      }

      return data;
    }

    return transactionData;
  };

  /**
   * A failed confirmation may leave the intent unusable, so remount the
   * payment element against a fresh one. Validation errors are exempt —
   * the shopper fixes the input in place and retries the same intent.
   */
  const handleExecuteFailure = async (
    executeErrors: BaseError[],
    { saveForFutureUse }: PaymentSchema,
  ) => {
    if (
      isAddingNewPaymentMethod &&
      !executeErrors.some(({ code }) => code === "PAYMENT_VALIDATION_ERROR")
    ) {
      setIsMounted(false);
      setTransactionData(undefined);

      const data = await initializeTransaction({
        id: checkout.id,
        amount: checkout.totalPrice.gross.amount,
        saveForFutureUse,
      });

      if (data) {
        setTransactionData(data);
      }

      return;
    }

    router.refresh();
  };

  const handlePlaceOrder = usePaymentSubmit({
    checkout,
    elementsRef,
    form,
    initializeGateway,
    isAddingNewPaymentMethod,
    isProcessing,
    onExecuteFailure: handleExecuteFailure,
    resolveTransactionData,
    setErrors,
    setIsProcessing,
    storeUrl,
  });

  useEffect(() => {
    if (isAddingNewPaymentMethod) {
      form.setValue("paymentMethod", undefined);

      return;
    }

    /**
     * The payment element writes the picked method type into `paymentMethod`,
     * so restore the saved-method selection when switching back to the tab.
     */
    form.setValue("paymentMethod", defaultPaymentMethod);
    setIsMounted(false);
  }, [form, isAddingNewPaymentMethod, defaultPaymentMethod]);

  /**
   * Using a new payment method requires a new intent secret which the
   * payment element is then created against.
   */
  useEffect(() => {
    if (!isAddingNewPaymentMethod) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      setIsMounted(false);
      setTransactionData(undefined);

      const data = await initializeTransaction({
        id: checkout.id,
        amount: checkout.totalPrice.gross.amount,
        saveForFutureUse,
      });

      if (isCancelled || !data) {
        return;
      }

      setTransactionData(data);
    })();

    return () => {
      isCancelled = true;
    };
  }, [
    checkout.id,
    checkout.totalPrice.gross.amount,
    isAddingNewPaymentMethod,
    saveForFutureUse,
  ]);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handlePlaceOrder)} noValidate>
        <div className="mb-8 space-y-6">
          <Tabs
            defaultValue={paymentMethodTab}
            onValueChange={(value) => setPaymentMethodTab(value as TabName)}
            className="grid gap-5"
          >
            <TabsList
              className={cn("grid w-full grid-cols-2", {
                hidden: !hasSavedPaymentMethods,
              })}
            >
              <TabsTrigger disabled={isLoading} value="saved">
                {t("payment.saved-methods")}
              </TabsTrigger>
              <TabsTrigger disabled={isLoading} value="new">
                {t("payment.new-method")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saved">
              <PaymentMethods methods={paymentGatewayMethods} />
            </TabsContent>

            <TabsContent value="new">
              <RadioGroup
                value={PaymentProvider}
                onValueChange={(value) =>
                  setPaymentProvider(value as PaymentProvidersType)
                }
                className="gap-4"
              >
                <label className="flex w-full cursor-pointer flex-col gap-3 rounded-md border p-4">
                  {/* Radio + descripción */}
                  <div className="flex w-full items-start gap-3">
                    <RadioGroupItem value="stripe" className="mt-1" />

                    <div className="flex-1">
                      <p className="font-medium">Paga con tu tarjeta u OXXO</p>
                      <p className="text-sm text-muted-foreground">
                        Paga con tu tarjeta de débito o 3 y 6 meses sin
                        intereses con tu tarjeta de credito, además de OXXO y
                        wallets.
                      </p>
                    </div>
                  </div>

                  {/* Contenido de Stripe */}
                  <div
                    className={cn("w-full", {
                      hidden: PaymentProvider !== "stripe",
                    })}
                  >
                    <div className="w-full">
                      <NewPaymentMethodSection
                        checkout={checkout}
                        initializeData={initializeData}
                        isMounted={isMounted}
                        isProcessing={isProcessing}
                        onReady={() => setIsMounted(true)}
                        ref={elementsRef}
                        showSaveForFutureUse={!!user}
                        transactionData={transactionData}
                      />
                    </div>

                    <div className="w-full">
                      <PlaceOrderButton
                        errors={errors}
                        isDisabled={isCountryChanging || !canProceed}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <RadioGroupItem value="paypal" className="mt-1" />

                  <div className="flex-1">
                    <p className="font-medium">PayPal</p>
                    <p className="text-sm text-muted-foreground">
                      Paga con tu cuenta PayPal.
                    </p>

                    <div
                      className={cn("mt-4 w-full", {
                        hidden: PaymentProvider !== "paypal",
                      })}
                    >
                      <PayPalPayment
                        checkout={checkout}
                        onUpdateBillingAddress={form.handleSubmit(
                          async ({
                            sameAsShippingAddress,
                            saveAddressForFutureUse,
                            billingAddress,
                          }) => {
                            delete billingAddress?.id;

                            const result = await updateBillingAddress({
                              checkout,
                              input: {
                                sameAsShippingAddress,
                                saveAddressForFutureUse,
                                billingAddress,
                              },
                              revalidateCheckout: false,
                            });

                            if (!result.ok) {
                              result.errors.forEach(({ field, code }) => {
                                if (isGlobalError(field)) {
                                  toast({
                                    variant: "destructive",
                                    description: t(`errors.${code}`),
                                  });
                                } else {
                                  form.setError(
                                    `billingAddress.${field}` as BillingAddressPath,
                                    {
                                      message: t(`errors.${code}`),
                                    },
                                  );
                                }
                              });

                              throw new Error(
                                "Could not update billing address",
                              );
                            }
                          },
                        )}
                      />
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </TabsContent>
          </Tabs>

          <BillingAddressSection
            activeTab={addressActiveTab}
            addressFormRows={addressFormRows}
            countries={countries}
            countryCode={countryCode}
            formattedAddresses={formattedAddresses}
            hasShippingAddress={!!checkout.shippingAddress}
            isProcessing={isProcessing}
            isShippingRequired={checkout.isShippingRequired}
            onCountryChange={setIsProcessing}
            sameAsShippingAddress={sameAsShippingAddress}
            setActiveTab={setAddressActiveTab}
            setIsCountryChanging={setIsCountryChanging}
            user={user}
          />
        </div>
      </form>
    </FormProvider>
  );
};
