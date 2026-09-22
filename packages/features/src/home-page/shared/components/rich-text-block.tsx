import { cn } from "@nimara/ui/lib/utils";

import { Section, type SectionTone } from "./section";

export type RichTextAlign = "left" | "center";
export type RichTextWidth = "narrow" | "default" | "wide";

export interface RichTextBlockCta {
	href: string;
	label: string;
}

export interface RichTextParagraph {
	title: string;
	text: string;
}

export interface RichTextBlockProps {
	align?: RichTextAlign;
	className?: string;
	cta?: RichTextBlockCta;
	eyebrow?: string;
	heading?: string;
  paragraphs: readonly RichTextParagraph[];
	tone?: SectionTone;
	width?: RichTextWidth;
}

const innerWidthClassName: Record<RichTextWidth, string> = {
	narrow: "max-w-2xl",
	default: "max-w-3xl",
	wide: "max-w-4xl",
};

export function RichTextBlock({
	heading,
	eyebrow,
	paragraphs,
	align = "left",
	width = "default",
	tone = "default",
	className,
}: RichTextBlockProps) {
	if (paragraphs.length === 0 && !heading) {
		return null;
	}

	const headingId = "rich-text-heading";
	const isCenter = align === "center";
	const isInverse = tone === "inverse";

	return (
		<Section tone={tone} bleed className={className} aria-labelledby={heading ? headingId : undefined}>
			<div
				className={cn(
          "flex w-full flex-col px-4 sm:px-6 lg:px-8",
          isCenter && "text-center",
        )}
			>
				{eyebrow ? (
					<p
						className={cn(
							"text-3xl font-semibold",
						)}
					>
						{eyebrow}
					</p>
				) : null}
				{heading ? (
					<h2 id={headingId} className={cn("text-balance text-h2", eyebrow && "mt-3")}>
						{heading}
					</h2>
				) : null}
        {paragraphs.length > 0 ? (
          <div
            className={cn(
              "grid w-full grid-cols-1 gap-8 text-pretty md:grid-cols-3",
              (heading || eyebrow) && "mt-5",
            )}
          >
            {paragraphs.map((paragraph) => (
              <div key={paragraph.title}>
                <h3 className="text-h3 text-xl font-medium">
                  {paragraph.title}
                </h3>

                <p
                  className={cn(
                    "mt-2 text-lead",
                    isInverse
                      ? "text-inverse-subtle"
                      : "text-muted-foreground",
                  )}
                >
                  {paragraph.text}
                </p>
              </div>
            ))}
          </div>
          ) : null}
			</div>
		</Section>
	);
}
