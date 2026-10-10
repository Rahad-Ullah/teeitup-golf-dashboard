import { FieldError, RegisterOptions, UseFormRegister } from "react-hook-form";

type SelectFieldProps = {
  name: string;
  title?: string;
  options: { label: string; value: string | number }[];
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
  rules?: RegisterOptions;
};

const SelectField = ({ title, name, options, register, error, disabled, rules }: SelectFieldProps) => {
  return (
    <div className="space-y-3">
      {title && <label className="block text-[11px] font-bold tracking-widest text-[#9CA3AF] uppercase mb-2">{title}</label>}
      <div className="relative group">
        <select
          {...register(name, rules)}
          disabled={disabled}
          className="w-full rounded-lg bg-white border border-slate-200 px-6 py-3 text-[14px] text-gray-600 outline-none transition-all focus:border-[#0b3b0b]/40 focus:bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm font-medium text-red-500 mt-2 px-1">
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default SelectField;
