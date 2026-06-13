import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ActiveFilters } from "@/pages/Category";

interface FilterSortBarProps {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  itemCount: number;
  activeFilters: ActiveFilters;
  setActiveFilters: (f: ActiveFilters) => void;
}

const CATEGORIES = ["Pokemon", "One Piece", "Accessories"];
const PRICE_RANGES = ["Under ₹10,000", "₹10,000 — ₹50,000", "₹50,000 — ₹1,00,000", "Over ₹1,00,000"];
const GRADES = ["PSA 10", "PSA 9", "BGS 9.5", "Ungraded"];

const FilterSortBar = ({
  filtersOpen,
  setFiltersOpen,
  itemCount,
  activeFilters,
  setActiveFilters,
}: FilterSortBarProps) => {

  // Local draft — only committed on "Apply"
  const [draft, setDraft] = useState<ActiveFilters>(activeFilters);

  const toggle = (key: keyof Pick<ActiveFilters, "categories" | "priceRanges" | "grades">, value: string) => {
    setDraft((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const apply = () => {
    setActiveFilters(draft);
    setFiltersOpen(false);
  };

  const clear = () => {
    const reset: ActiveFilters = { categories: [], priceRanges: [], grades: [], sortBy: draft.sortBy };
    setDraft(reset);
    setActiveFilters(reset);
    setFiltersOpen(false);
  };

  const activeCount =
    activeFilters.categories.length +
    activeFilters.priceRanges.length +
    activeFilters.grades.length;

  return (
    <section className="w-full px-6 mb-8 border-b border-border pb-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-light text-muted-foreground">{itemCount} items</p>

        <div className="flex items-center gap-4">
          <Sheet open={filtersOpen} onOpenChange={(o) => { setFiltersOpen(o); if (o) setDraft(activeFilters); }}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="font-light hover:bg-transparent relative">
                Filters
                {activeCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-foreground text-background text-[9px] font-mono">
                    {activeCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 bg-background border-none shadow-none">
              <SheetHeader className="mb-6 border-b border-border pb-4">
                <SheetTitle className="text-lg font-light">Filters</SheetTitle>
              </SheetHeader>

              <div className="space-y-8">
                {/* Category */}
                <div>
                  <h3 className="text-sm font-light mb-4 text-foreground">Category</h3>
                  <div className="space-y-3">
                    {CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center space-x-3">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={draft.categories.includes(cat)}
                          onCheckedChange={() => toggle("categories", cat)}
                          className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                        />
                        <Label htmlFor={`cat-${cat}`} className="text-sm font-light text-foreground cursor-pointer">
                          {cat}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price */}
                <div>
                  <h3 className="text-sm font-light mb-4 text-foreground">Price</h3>
                  <div className="space-y-3">
                    {PRICE_RANGES.map((range) => (
                      <div key={range} className="flex items-center space-x-3">
                        <Checkbox
                          id={`price-${range}`}
                          checked={draft.priceRanges.includes(range)}
                          onCheckedChange={() => toggle("priceRanges", range)}
                          className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                        />
                        <Label htmlFor={`price-${range}`} className="text-sm font-light text-foreground cursor-pointer">
                          {range}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Grade */}
                <div>
                  <h3 className="text-sm font-light mb-4 text-foreground">Grade</h3>
                  <div className="space-y-3">
                    {GRADES.map((grade) => (
                      <div key={grade} className="flex items-center space-x-3">
                        <Checkbox
                          id={`grade-${grade}`}
                          checked={draft.grades.includes(grade)}
                          onCheckedChange={() => toggle("grades", grade)}
                          className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                        />
                        <Label htmlFor={`grade-${grade}`} className="text-sm font-light text-foreground cursor-pointer">
                          {grade}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={apply}
                    size="sm"
                    className="w-full font-normal"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    onClick={clear}
                    variant="ghost"
                    size="sm"
                    className="w-full font-light hover:bg-transparent hover:underline"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Select
            value={activeFilters.sortBy}
            onValueChange={(v) => setActiveFilters({ ...activeFilters, sortBy: v })}
          >
            <SelectTrigger className="w-auto border-none bg-transparent text-sm font-light shadow-none rounded-none pr-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="shadow-none border-none rounded-none bg-background">
              <SelectItem value="featured" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent pl-2 [&>span:first-child]:hidden">Featured</SelectItem>
              <SelectItem value="price-low" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent pl-2 [&>span:first-child]:hidden">Price: Low to High</SelectItem>
              <SelectItem value="price-high" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent pl-2 [&>span:first-child]:hidden">Price: High to Low</SelectItem>
              <SelectItem value="newest" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent pl-2 [&>span:first-child]:hidden">Newest</SelectItem>
              <SelectItem value="name" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent pl-2 [&>span:first-child]:hidden">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default FilterSortBar;
