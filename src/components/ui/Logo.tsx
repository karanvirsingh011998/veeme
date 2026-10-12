type LogoProps = {
  /** Rendered height in pixels. Width follows the image. */
  height?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Vemee lockup from /images/logo.jpg. The file already includes the wordmark.
 */
export function Logo({ height = 56, className, priority = false }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo.jpg"
      alt="Vemee"
      width={height}
      height={height}
      className={className}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      style={{ height, width: "auto" }}
    />
  );
}
