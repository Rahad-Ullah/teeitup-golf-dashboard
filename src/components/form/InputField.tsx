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

type InputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  title?: string;
  placeholder?: string;
  type?: string;
  register?: UseFormRegister<TFieldValues>;
  control?: Control<TFieldValues, any>;
  error?: FieldError;
  disabled?: boolean;
  rules?: RegisterOptions<TFieldValues, TName>;
};

const InputField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  title,
  name,
  placeholder,
  type = "text",
  register,
  control,
  error,
  disabled,
  rules,
}: InputFieldProps<TFieldValues, TName>) => {
  const controller = control
    ? useController({
        name,
        control,
        rules: rules as any,
      })
    : null;
  const value = controller ? controller.field.value ?? "" : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (controller) {
      if (type === "number" || rules?.valueAsNumber) {
        const val = e.target.value;
        controller.field.onChange(val === "" ? undefined : Number(val));
      } else {
        controller.field.onChange(e.target.value);
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
        <input
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
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          // A focused <input type="number"> silently changes value when the
          // page is scrolled with the cursor over it (Chrome/Edge default
          // behavior) — blur on wheel so scrolling past it on a long form
          // never mutates whatever the user actually typed.
          onWheel={type === "number" ? (e) => e.currentTarget.blur() : undefined}
          className="w-full rounded-lg bg-white border border-slate-200 px-6 py-3 text-[14px] text-gray-600 outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#0b3b0b]/40 focus:bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        />

        {fieldError && (
          <p className="text-sm font-medium text-red-500 mt-2 px-1">
            {fieldError.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default InputField;