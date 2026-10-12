import { EmptyCard, PageBody } from "@/components/page";

export default function IssuesPage() {
  return (
    <PageBody>
      <EmptyCard
        title="Žádné zapsané problémy"
        text="Tady si povedeš otevřené a vyřešené problémy s autem, textem nebo hlasem."
      />
    </PageBody>
  );
}
