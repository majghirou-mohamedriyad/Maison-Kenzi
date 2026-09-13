interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <header className="pr-6 pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 border-b border-border">
      <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-muted-foreground">
          {subtitle}
        </p>
      )}
    </header>
  );
};

export default PageHeader;