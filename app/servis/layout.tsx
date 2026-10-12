import { PageHeader } from "@/components/page";
import { ActiveCarPill } from "@/components/service/active-car-pill";
import { ServiceTabs } from "@/components/service/service-tabs";

export default function ServiceLayout({ children }: LayoutProps<"/servis">) {
  return (
    <>
      <PageHeader title="Servis" action={<ActiveCarPill />}>
        <ServiceTabs />
      </PageHeader>
      {children}
    </>
  );
}
