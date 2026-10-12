import { EmptyCard, PageBody, PageHeader } from "@/components/page";

export default function LogbookPage() {
  return (
    <>
      <PageHeader title="Deník" />
      <PageBody>
        <EmptyCard
          title="Zatím žádné tankování"
          text="Tady bude spotřeba, náklady za měsíc, graf a údržba."
        />
      </PageBody>
    </>
  );
}
