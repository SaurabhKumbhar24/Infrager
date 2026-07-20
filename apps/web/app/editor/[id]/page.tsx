import EditorLoader from "@/components/editor/EditorLoader";

export const metadata = {
  title: "Editor",
  robots: { index: false },
};

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorLoader projectId={id} />;
}
