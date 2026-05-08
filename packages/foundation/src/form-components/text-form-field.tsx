"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef } from "react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormContext,
} from "@nimara/ui/components/form";
import { Input, type InputProps } from "@nimara/ui/components/input";

export interface TextFormFieldProps extends Omit<InputProps, "onChange"> {
  isRequired?: boolean;
  label: string;
  onChange?: (value: string) => void;
}

type GoogleMapsListener = {
  remove: () => void;
};

export function TextFormField({
  label,
  name = "",
  isRequired = false,
  placeholder,
  onChange,
  type,
  ...props
}: TextFormFieldProps) {
  const { control, setValue } = useFormContext();
  const { error } = control.getFieldState(name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (name !== "streetAddress1") {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || !inputRef.current) {
      return;
    }

    setOptions({
      key: apiKey,
      v: "weekly",
      region: "MX",
      language: "es",
    });

    let listener: GoogleMapsListener | undefined;
    let autocomplete: google.maps.places.Autocomplete;
    let isMounted = true;

    const init = async () => {
      const { Autocomplete } = (await importLibrary(
        "places",
      ));

      if (!isMounted || !inputRef.current) {
        return;
      }

      autocomplete = new Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: {
          country: "mx",
        },
        fields: ["address_components", "formatted_address"],
      });

      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();

        if (!place?.address_components) {
          return;
        }

        const get = (type: string, short = false) => {
          const component = place.address_components?.find((item) =>
            item.types.includes(type),
          );

          return short
            ? (component?.short_name ?? "")
            : (component?.long_name ?? "");
        };

        const streetNumber = get("street_number");
        const route = get("route");
        const streetAddress1 = `${route} ${streetNumber}`.trim();

        const city =
          get("locality") ||
          get("administrative_area_level_2") ||
          get("sublocality");

        setValue("streetAddress1", streetAddress1, {
          shouldDirty: true,
          shouldValidate: true,
        });

        setValue(
          "streetAddress2",
          get("sublocality_level_1") ||
            get("neighborhood") ||
            get("sublocality"),
          {
            shouldDirty: true,
            shouldValidate: true,
          },
        );

        setValue("city", city, {
          shouldDirty: true,
          shouldValidate: true,
        });

        setValue("countryArea", get("administrative_area_level_1", true), {
          shouldDirty: true,
          shouldValidate: true,
        });

        setValue("postalCode", get("postal_code"), {
          shouldDirty: true,
          shouldValidate: true,
        });
      });
    };

    void init();

    return () => {
      isMounted = false;
      listener?.remove();
    };
  }, [name, setValue]);

  return (
    <FormField
      key={name}
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem className="flex-1">
            <FormLabel htmlFor={name}>
              {label}
              {isRequired && "*"}
            </FormLabel>

            <FormControl>
              <div className="flex">
                <Input
                  aria-label={label}
                  placeholder={placeholder}
                  {...field}
                  ref={inputRef}
                  value={field?.value ?? ""}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.(e.target.value);
                  }}
                  type={type}
                  error={!!error}
                  {...props}
                />
              </div>
            </FormControl>

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
