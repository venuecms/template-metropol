import { useTranslations } from "next-intl";

import { ColumnLeft, ColumnRight, TwoColumnLayout } from "@/components/layout";

export function FeaturedEventsError() {
  return null; // Featured events are optional, so hide on error
}

export function EventsError() {
  const t = useTranslations("events");

  return (
    <TwoColumnLayout>
      <ColumnLeft className="hidden text-sm text-secondary lg:flex" />
      <ColumnRight>
        <p className="text-secondary">{t("load_error")}</p>
      </ColumnRight>
    </TwoColumnLayout>
  );
}

export function SiteContentError() {
  return null; // The site text is optional, so hide on error
}

export function ProductsError() {
  return null; // Products are optional and site-specific, so hide on error
}
