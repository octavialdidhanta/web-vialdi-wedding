export function SectionTitle({
  title,
  subtitle,
  align = "left",
}: {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <h2 className="text-3xl font-bold leading-tight text-navy md:text-4xl lg:text-5xl">
        {title}
      </h2>
      <div
        className={`mt-3 h-1 w-16 rounded-full bg-accent-orange ${
          align === "center" ? "mx-auto" : ""
        }`}
      />
      {subtitle && (
        <p
          className={`mt-5 text-base text-muted-foreground md:text-lg ${
            align === "center" ? "mx-auto max-w-2xl" : "max-w-3xl"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
