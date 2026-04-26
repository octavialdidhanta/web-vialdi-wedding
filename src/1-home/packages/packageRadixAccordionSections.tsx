import { AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";
import { PackageAccordionRoot } from "@/1-home/packages/packageAccordionViewport";
import type { WeddingPackageSection } from "@/blog/weddingPackages";
import { WeddingPackageSectionBody } from "@/1-home/packages/weddingPackageCardSectionBody";
import {
  weddingPackageSectionContentClass,
  weddingPackageSectionTriggerClass,
} from "@/1-home/packages/weddingPackageCardSectionStyles";

export function PackageRadixAccordionSections({
  sections,
}: {
  sections: WeddingPackageSection[];
}) {
  return (
    <PackageAccordionRoot type="single" collapsible className="w-full space-y-2">
      {sections.map((s) => (
        <AccordionItem key={s.id} value={s.id} className="border-0">
          <AccordionTrigger className={weddingPackageSectionTriggerClass}>{s.title}</AccordionTrigger>
          <AccordionContent className={weddingPackageSectionContentClass}>
            <WeddingPackageSectionBody s={s} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </PackageAccordionRoot>
  );
}
