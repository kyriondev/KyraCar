import { EmptyCard, PageBody, PageHeader } from "@/components/page";

export default function KyraPage() {
  return (
    <>
      <PageHeader title="Kyra" />
      <PageBody>
        <EmptyCard
          title="Asistentka se připravuje"
          text="Chat, hlasový vstup a zápis do deníku přijdou v dalších krocích."
        />
      </PageBody>
    </>
  );
}
