import ViewerClient from "./viewer-client";

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function ViewerPage({ params }: Props) {
  const { roomId } = await params;
  return <ViewerClient roomId={roomId} />;
}
