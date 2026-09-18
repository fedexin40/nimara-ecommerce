import { Skeleton } from "@nimara/ui/components/skeleton";

type ProductTitleProps = {
  className?: string;
  title: string;
};

export const ProductTitle = ({ title, className }: ProductTitleProps) => {
  return (
    <h1
      className={`text-primary text-center md:text-left md:text-3xl text-2xl font-semibold mt-10 ${className}`}
    >
      {title}
    </h1>
  );
};

export const ProductTitleSkeleton = () => {
  return <Skeleton className="mb-4 h-8 w-3/4" />;
};
