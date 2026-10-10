"use no memo";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegister,
  useController,
} from "react-hook-form";

type SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  title?: string;
  options: { label: string; value: string | number }[];
  register?: UseFormRegister<TFieldValues>;
  control?: Control<TFieldValues, any>;
  error?: FieldError;
  disabled?: boolean;
  rules?: RegisterOptions<TFieldValues, TName>;
};

const SelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  title,
  name,
  options,
  register,
  control,
  error,
  disabled,
  rules,
}: SelectFieldProps<TFieldValues, TName>) => {
  const controller = control
    ? useController({
        name,
        control,
        rules: rules as any,
      })
    : null;
  const value = controller ? controller.field.value ?? "" : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (controller) {
      const val = e.target.value;
      if (rules?.valueAsNumber) {
        controller.field.onChange(val === "" ? undefined : Number(val));
      } else {
        controller.field.onChange(val);
      }
    }
  };

  const registerProps = !controller && register ? register(name, rules) : {};
  const fieldError = error || controller?.fieldState.error;

  return (
    <div className="space-y-3">
      {title && (
        <label className="block text-[11px] font-bold tracking-widest text-[#9CA3AF] uppercase mb-2">
          {title}
        </label>
      )}
      <div className="relative group">
        <select
          {...registerProps}
          {...(controller
            ? {
                name: controller.field.name,
                ref: controller.field.ref,
                value,
                onChange: handleChange,
                onBlur: controller.field.onBlur,
              }
            : {})}
          disabled={disabled}
          className="w-full rounded-lg bg-white border border-slate-200 px-6 py-3 text-[14px] text-gray-600 outline-none transition-all focus:border-[#0b3b0b]/40 focus:bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {fieldError && (
          <p className="text-sm font-medium text-red-500 mt-2 px-1">
            {fieldError.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default SelectField;
