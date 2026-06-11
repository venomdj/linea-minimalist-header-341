import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CategorySelect = ({
  value,
  onChange,
  placeholder = "Select a category...",
  disabled = false,
}: CategorySelectProps) => {
  const { categories, loading } = useCategories();

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      <option value="">{placeholder}</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategorySelect;
