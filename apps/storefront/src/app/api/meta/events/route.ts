import {
  Content,
  CustomData,
  EventRequest,
  ServerEvent,
  UserData,
} from "facebook-nodejs-business-sdk";
import { type NextRequest, NextResponse } from "next/server";

import type {
  MetaEventParameters,
  MetaStandardEventName,
  MetaTrackingEvent,
} from "@nimara/infrastructure/tracking/meta/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_CAPI_TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

const META_EXTERNAL_ID_COOKIE = "_meta_external_id";
const META_EXTERNAL_ID_MAX_AGE = 60 * 60 * 24 * 365;

const ALLOWED_EVENT_NAMES = new Set<MetaStandardEventName>([
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Search",
  "CompleteRegistration",
]);

const MAX_BODY_SIZE = 64_000;

const jsonError = (message: string, status: number): NextResponse =>
  NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAllowedEventName = (value: unknown): value is MetaStandardEventName =>
  typeof value === "string" &&
  ALLOWED_EVENT_NAMES.has(value as MetaStandardEventName);

const isValidEventId = (value: unknown): value is string =>
  typeof value === "string" && value.length >= 1 && value.length <= 200;

const isValidUrl = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const normalizeString = (value: string | undefined): string | undefined => {
  const normalized = value?.trim().toLowerCase();

  return normalized || undefined;
};

const normalizePhone = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  /*
   * Meta espera el teléfono con código de país y solo dígitos.
   * Ejemplo México: 525512345678.
   */
  const normalized = value.replace(/\D/g, "");

  return normalized || undefined;
};

const getClientIp = (request: NextRequest): string | undefined => {
  /*
   * En Vercel, x-forwarded-for puede contener varias direcciones.
   * La primera corresponde normalmente al cliente original.
   */
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);
  }

  return request.headers.get("x-real-ip") ?? undefined;
};

const getOrCreateMetaExternalId = (
  request: NextRequest,
): {
  externalId: string;
  isNew: boolean;
} => {
  const existingExternalId = request.cookies.get(
    META_EXTERNAL_ID_COOKIE,
  )?.value;

  if (existingExternalId) {
    return {
      externalId: existingExternalId,
      isNew: false,
    };
  }

  return {
    externalId: Math.random().toString(36).substring(2),
    isNew: true,
  };
};

const setMetaExternalIdCookie = (
  response: NextResponse,
  externalId: string,
): void => {
  response.cookies.set({
    name: META_EXTERNAL_ID_COOKIE,
    value: externalId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: META_EXTERNAL_ID_MAX_AGE,
  });
};

const getEventSourceUrl = (
  request: NextRequest,
  suppliedUrl?: string,
): string | undefined => {
  if (suppliedUrl && isValidUrl(suppliedUrl)) {
    return suppliedUrl;
  }

  const referer = request.headers.get("referer");

  if (referer && isValidUrl(referer)) {
    return referer;
  }

  return undefined;
};

const parseRequestBody = async (
  request: NextRequest,
): Promise<MetaTrackingEvent | null> => {
  const contentType = request.headers.get("content-type");

  if (!contentType?.toLowerCase().includes("application/json")) {
    return null;
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_SIZE) {
    return null;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  if (!isRecord(body)) {
    return null;
  }

  if (!isAllowedEventName(body.eventName)) {
    return null;
  }

  if (!isValidEventId(body.eventId)) {
    return null;
  }

  if (body.eventSourceUrl !== undefined && !isValidUrl(body.eventSourceUrl)) {
    return null;
  }

  if (body.parameters !== undefined && !isRecord(body.parameters)) {
    return null;
  }

  if (body.customer !== undefined && !isRecord(body.customer)) {
    return null;
  }

  return body as MetaTrackingEvent;
};

const createUserData = (
  request: NextRequest,
  customer: MetaTrackingEvent["customer"],
  externalId: string,
): InstanceType<typeof UserData> => {
  const userData = new UserData();

  const clientIpAddress = getClientIp(request);
  const clientUserAgent = request.headers.get("user-agent") ?? undefined;
  const fbp = request.cookies.get("_fbp")?.value;
  const fbc = request.cookies.get("_fbc")?.value;

  if (clientIpAddress) {
    userData.setClientIpAddress(clientIpAddress);
  }

  if (clientUserAgent) {
    userData.setClientUserAgent(clientUserAgent);
  }

  /*
   * No generes valores artificiales para _fbp o _fbc.
   * Solo envía las cookies cuando realmente existen.
   */
  if (fbp) {
    userData.setFbp(fbp);
  }

  if (fbc) {
    userData.setFbc(fbc);
  }

  /*
   * Identificador first-party generado por nuestra aplicación.
   * Se mantiene estable mediante una cookie HttpOnly.
   */
  userData.setExternalId(externalId);

  if (!customer) {
    return userData;
  }

  /*
   * El SDK oficial normaliza y aplica SHA-256 a estos campos.
   * No debes aplicar hash otra vez antes de entregárselos al SDK.
   */
  const email = normalizeString(customer.email);
  const phone = normalizePhone(customer.phone);
  const firstName = normalizeString(customer.firstName);
  const lastName = normalizeString(customer.lastName);
  const city = normalizeString(customer.city);
  const state = normalizeString(customer.state);
  const postalCode = normalizeString(customer.postalCode);
  const country = normalizeString(customer.country);

  if (email) {
    userData.setEmail(email);
  }

  if (phone) {
    userData.setPhone(phone);
  }

  if (firstName) {
    userData.setFirstName(firstName);
  }

  if (lastName) {
    userData.setLastName(lastName);
  }

  if (city) {
    userData.setCity(city);
  }

  if (state) {
    userData.setState(state);
  }

  if (postalCode) {
    userData.setZip(postalCode);
  }

  if (country) {
    userData.setCountry(country);
  }

  return userData;
};

const createContents = (
  parameters: MetaEventParameters,
): InstanceType<typeof Content>[] => {
  if (!Array.isArray(parameters.contents)) {
    return [];
  }

  return parameters.contents
    .filter(
      (
        item,
      ): item is {
        id: string;
        item_price?: number;
        quantity?: number;
      } => isRecord(item) && typeof item.id === "string" && item.id.length > 0,
    )
    .map((item) => {
      const content = new Content().setId(item.id);

      if (
        typeof item.quantity === "number" &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
      ) {
        content.setQuantity(item.quantity);
      }

      if (
        typeof item.item_price === "number" &&
        Number.isFinite(item.item_price) &&
        item.item_price >= 0
      ) {
        content.setItemPrice(item.item_price);
      }

      return content;
    });
};

const createCustomData = (
  parameters: MetaEventParameters = {},
): InstanceType<typeof CustomData> => {
  const customData = new CustomData();

  if (typeof parameters.currency === "string" && parameters.currency.trim()) {
    customData.setCurrency(parameters.currency.trim().toUpperCase());
  }

  if (
    typeof parameters.value === "number" &&
    Number.isFinite(parameters.value) &&
    parameters.value >= 0
  ) {
    customData.setValue(parameters.value);
  }

  if (
    Array.isArray(parameters.content_ids) &&
    parameters.content_ids.every((id) => typeof id === "string")
  ) {
    customData.setContentIds(parameters.content_ids);
  }

  if (
    typeof parameters.content_type === "string" &&
    parameters.content_type.trim()
  ) {
    customData.setContentType(parameters.content_type);
  }

  if (
    typeof parameters.content_name === "string" &&
    parameters.content_name.trim()
  ) {
    customData.setContentName(parameters.content_name);
  }

  if (
    typeof parameters.search_string === "string" &&
    parameters.search_string.trim()
  ) {
    customData.setSearchString(parameters.search_string);
  }

  if (typeof parameters.order_id === "string" && parameters.order_id.trim()) {
    customData.setOrderId(parameters.order_id);
  }

  const contents = createContents(parameters);

  if (contents.length > 0) {
    customData.setContents(contents);
  }

  /*
   * CustomData no expone necesariamente setters para cada parámetro
   * personalizado en todas las versiones del SDK.
   *
   * Los campos fundamentales para optimización son:
   * value, currency, contents, content_ids, content_type y order_id.
   */
  return customData;
};

const validateCommerceEvent = (event: MetaTrackingEvent): string | null => {
  const parameters = event.parameters ?? {};

  if (event.eventName === "Purchase") {
    if (
      typeof parameters.value !== "number" ||
      !Number.isFinite(parameters.value)
    ) {
      return "Purchase requires a valid value";
    }

    if (typeof parameters.currency !== "string" || !parameters.currency) {
      return "Purchase requires currency";
    }

    if (typeof parameters.order_id !== "string" || !parameters.order_id) {
      return "Purchase requires order_id";
    }
  }

  return null;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) {
    console.error("Meta CAPI environment variables are missing");

    return jsonError("Meta Conversions API is not configured", 503);
  }

  const event = await parseRequestBody(request);

  if (!event) {
    return jsonError("Invalid Meta event payload", 400);
  }

  const validationError = validateCommerceEvent(event);

  if (validationError) {
    return jsonError(validationError, 422);
  }

  const eventSourceUrl = getEventSourceUrl(request, event.eventSourceUrl);

  /*
   * Meta requiere event_source_url para eventos cuyo
   * action_source es website.
   */
  if (!eventSourceUrl) {
    return jsonError("Unable to determine event_source_url", 422);
  }

  const { externalId, isNew: isNewExternalId } =
    getOrCreateMetaExternalId(request);

  const userData = createUserData(request, event.customer, externalId);

  const customData = createCustomData(event.parameters);

  const serverEvent = new ServerEvent()
    .setEventName(event.eventName)
    .setEventTime(Math.floor(Date.now() / 1000))
    .setEventId(event.eventId)
    .setActionSource("website")
    .setEventSourceUrl(eventSourceUrl)
    .setUserData(userData)
    .setCustomData(customData);

  try {
    let eventRequest = new EventRequest(
      META_CAPI_ACCESS_TOKEN,
      META_PIXEL_ID,
    ).setEvents([serverEvent]);

    if (META_CAPI_TEST_EVENT_CODE) {
      eventRequest = eventRequest.setTestEventCode(META_CAPI_TEST_EVENT_CODE);
    }

    const response = await eventRequest.execute();

    const nextResponse = NextResponse.json(
      {
        success: true,
        eventId: event.eventId,
        eventsReceived:
          response?._events_received ?? response?.events_received ?? null,
        messages: response?._messages ?? [],
        traceId: response?._fbtrace_id ?? response?.fbtrace_id ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );

    if (isNewExternalId) {
      setMetaExternalIdCookie(nextResponse, externalId);
    }

    return nextResponse;
  } catch (error) {
    /*
     * No expongas el token ni la respuesta completa de Meta
     * al navegador.
     */
    console.error("Meta CAPI request failed", {
      eventName: event.eventName,
      eventId: event.eventId,
      error,
    });

    return jsonError("Meta Conversions API request failed", 502);
  }
}
