import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Shared Vemee button — primary sage CTA, secondary outline, or ghost.
 */
export function Button(props: ButtonProps) {
  const { children, variant = "primary", className = "" } = props;
  const classes = `btn btn-${variant} ${className}`.trim();

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const {
    children: _c,
    variant: _v,
    className: _class,
    href: _href,
    type = "button",
    ...rest
  } = props as ButtonAsButton;

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}