import { PageHeader } from "@/components/page";
import { ServiceTabs } from "@/components/service-tabs";

export default function ServiceLayout({ children }: LayoutProps<"/servis">) {
  return (
    <>
      <PageHeader title="Servis">
        <ServiceTabs />
      </PageHeader>
      {children}
    </>
  );
}
