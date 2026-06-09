import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className = "", ...rest },
  ref,
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...rest}
        ref={ref}
        type={show ? "text" : "password"}
        className={
          "w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 " +
          className
        }
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 px-3 inline-flex items-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
