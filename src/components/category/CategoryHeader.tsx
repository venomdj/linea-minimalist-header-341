import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Props { category: string }

const CategoryHeader = ({ category }: Props) => {
  const title = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return (
    <section className="w-full px-6 lg:px-12 pt-10 pb-12 border-b border-border/60 mb-10">
      <Breadcrumb>
        <BreadcrumbList className="text-muted-foreground">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="hover:text-foreground transition-colors text-xs font-mono tracking-wider">HOME</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground text-xs font-mono tracking-wider uppercase">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">The Marketplace</p>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight text-foreground leading-[0.95]">
            {title}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-md">
          Every listing in {title.toLowerCase()} is graded, authenticated, and held under escrow until verified delivery. Prices in USD.
        </p>
      </div>
    </section>
  );
};

export default CategoryHeader;
