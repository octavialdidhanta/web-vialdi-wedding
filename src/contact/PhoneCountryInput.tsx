import { useMemo } from "react";
import {
  PHONE_COUNTRY_DIALS,
  type PhoneCountryDial,
  composeInternationalPhone,
  parsePhoneForCountryFields,
  sanitizeNationalForDial,
} from "@/contact/leadValidators";
import { Input } from "@/share/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/share/ui/select";
import { cn } from "@/share/lib/utils";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  name?: string;
  autoComplete?: string;
  placeholderNational?: string;
  className?: string;
  triggerClassName?: string;
  inputClassName?: string;
};

export function PhoneCountryInput({
  value,
  onChange,
  onBlur,
  name,
  autoComplete = "tel",
  placeholderNational = "812xxxxxxxx",
  className,
  triggerClassName,
  inputClassName,
}: Props) {
  const { dial, national } = useMemo(() => parsePhoneForCountryFields(value), [value]);

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={dial}
        onValueChange={(next) => {
          const d = next as PhoneCountryDial;
          const nat = parsePhoneForCountryFields(value).national;
          onChange(composeInternationalPhone(d, nat));
        }}
      >
        <SelectTrigger
          aria-label="Kode negara"
          className={cn("h-9 w-[4.25rem] shrink-0 px-1.5 text-sm tabular-nums", triggerClassName)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PHONE_COUNTRY_DIALS.map((d) => (
            <SelectItem key={d} value={d} className="tabular-nums">
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        name={name}
        autoComplete={autoComplete}
        inputMode="numeric"
        value={national}
        onChange={(e) => {
          const nat = sanitizeNationalForDial(dial, e.target.value);
          onChange(composeInternationalPhone(dial, nat));
        }}
        onBlur={onBlur}
        placeholder={placeholderNational}
        className={cn("h-9 min-w-0 flex-1 text-sm", inputClassName)}
      />
    </div>
  );
}
