import { Star } from "lucide-react";

import { Skeleton } from "@nimara/ui/components/skeleton";

const REVIEWS = [
  {
    id: 1,
    content: "Excelente producto!",
    rating: 5,
    author: "Josefina Lozano",
    date: "2025-10-01",
  },
  {
    id: 2,
    content: "Muy satisfecho con mi compra. Lo recomiendo mil!",
    rating: 4,
    author: "Rodrigo Guzman",
    date: "2025-11-02",
  },
  {
    id: 3,
    content: "Me tardo un poco en llegar. Y son un poco mas pequeños de lo que pensaba. Recomendación regular.",
    rating: 2,
    author: "Alicia Villaseñor",
    date: "2025-12-03",
  },
  {
    id: 4,
    content: "Execelente calidad y rápida entrega. Definitivamente volvería a comprar. Enormes gracias!",
    rating: 5,
    author: "Tatiana",
    date: "2026-01-04",
  },
  {
    id: 5,
    content:
      "Si volvería a comprar, Lo recomiendo! excelente servicio y calidad. Muy satisfecha.",
    rating: 5,
    author: "Javier Estrada",
    date: "2026-02-05",
  },
  {
    id: 6,
    content:
      "Producto normal, calidad normal. En general normal. Siento que tiene una buena relación precio calidad.",
    rating: 3,
    author: "Alondra Paola Cruz",
    date: "2026-03-06",
  },
  {
    id: 7,
    content:
      "Increible experiencia, lo ame! Lo recomiendo para los demas. Es mi segunda compra y seguro hare muchas mas.",
    rating: 5,
    author: "Karla Xicale",
    date: "2026-05-07",
  },
];

/**
 * This is just a placeholder for the product reviews component.
 * In a real application, this would fetch and display actual product reviews.
 * @returns A list of product reviews.
 * This component simulates fetching product reviews and displays them in a list format.
 */
export const ProductReviews = async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate data fetching

  return (
    <div className="bg-background mt-8">
      <div className="flex justify-between">
        <h2 className="text-primary mb-4 text-xl">Calificaciones</h2>
        <p className="text-muted-foreground mb-6">{REVIEWS.length} calificaciones</p>
      </div>
      <ul className="space-y-4">
        {REVIEWS.map((review) => (
          <li key={review.id} className="rounded-lg border p-4">
            <p className="text-primary">{review.content}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center text-yellow-500">
                {[...Array(review.rating)].map((_, index) => (
                  <Star
                    key={index}
                    fill="currentColor"
                    className="inline h-4 w-4"
                    strokeWidth={0}
                  />
                ))}
              </span>
              <span className="text-foreground text-sm">
                Por {review.author} el{" "}
                {new Date(review.date).toLocaleDateString()}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const ProductReviewsSkeleton = () => {
  return (
    <div className="bg-background mt-8">
      <h2 className="text-primary mb-4 text-xl">Reviews</h2>
      <ul className="space-y-4">
        {[...Array(4)].map((_, index) => (
          <li key={index} className="rounded-lg border p-4">
            <div className="mb-2">
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-muted-foreground flex items-center">
                {[...Array(5)].map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    fill="currentColor"
                    className="inline h-4 w-4"
                    strokeWidth={0}
                  />
                ))}
              </span>
              <Skeleton className="h-4 w-1/4" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
