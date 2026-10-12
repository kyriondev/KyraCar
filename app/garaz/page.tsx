import { EmptyCard, PageBody, PageHeader } from "@/components/page";

export default function GaragePage() {
  return (
    <>
      <PageHeader title="Garáž" />
      <PageBody>
        <EmptyCard
          title="Zatím žádné auto"
          text="Tady bude profil auta, přepínač aut a připomínky (pojištění, STK, dálniční známka, olej)."
        />
      </PageBody>
    </>
  );
}
