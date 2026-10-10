"use no memo";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
  useController,
} from "react-hook-form";

type TextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  title: string;
  placeholder?: string;
  type?: string;
  register?: UseFormRegister<TFieldValues>;
  control?: Control<TFieldValues, any>;
  error?: FieldError;
  rows?: number;
};

const TextareaField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  title,
  name,
  placeholder,
  register,
  control,
  error,
  rows = 4,
}: TextareaFieldProps<TFieldValues, TName>) => {
  const controller = control
    ? useController({
        name,
        control,
      })
    : null;
  const value = controller ? controller.field.value ?? "" : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (controller) {
      controller.field.onChange(e.target.value);
    }
  };

  const registerProps = !controller && register ? register(name) : {};
  const fieldError = error || controller?.fieldState.error;

  return (
    <div className="space-y-3">
      <label className="block text-[11px] font-bold tracking-widest text-[#9CA3AF] uppercase">
        {title}
      </label>
      <div className="relative group">
        <textarea
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
          placeholder={placeholder}
          className={`w-full bg-white border rounded-lg py-3 px-6 text-[14px] text-gray-600 placeholder:text-gray-400 outline-none transition-all focus:border-[#0B3B0B]/40 focus:bg-white
        ${
          fieldError
            ? "border-red-400 bg-red-50/30"
            : "border-slate-200"
        }`}
          rows={rows}
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

export default TextareaField;