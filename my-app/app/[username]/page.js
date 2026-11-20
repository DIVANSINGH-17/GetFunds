import PaymentPage from "@/components/PaymentPage";
import { getPublicCreatorData } from "@/actions/useractions";
import { notFound } from "next/navigation";
import { cache } from "react";

// Deduplicates the lookup shared by generateMetadata and the page render.
const loadCreator = cache(getPublicCreatorData);

const Username = async ({ params }) => {
  const { username } = await params;
  const creatorData = await loadCreator(username);

  if (!creatorData) {
    notFound();
  }

  return (
    <PaymentPage
      username={creatorData.profile.username}
      initialData={creatorData}
    />
  );
};

export default Username;

export async function generateMetadata({ params }) {
  const { username } = await params;
  const creatorData = await loadCreator(username).catch(() => null);

  if (!creatorData) {
    return { title: "Creator not found" };
  }

  const { profile } = creatorData;
  const description =
    profile.bio ||
    `Support ${profile.name} (@${profile.username}) on GetFunds Demo and view their projects and supporters.`;

  return {
    title: `Support ${profile.name}`,
    description,
    openGraph: {
      title: `Support ${profile.name} on GetFunds`,
      description,
      images: profile.profilepic ? [profile.profilepic] : undefined,
    },
  };
}
