import { WorkerDetailClient } from './WorkerDetailClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function WorkerPreviewPage({ params }: Props) {
  const { id } = await params;
  return <WorkerDetailClient id={id} />;
}
