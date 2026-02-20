import HostClient from "./host-client";

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function HostPage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const { token } = await searchParams;

  return <HostClient roomId={roomId} token={token || ""} />;
}
