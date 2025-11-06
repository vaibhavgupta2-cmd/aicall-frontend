"use client";

import EmbedTalk from "@/app/agents/[id]/embed/EmbedTalk";

const Embed = () => {
  return (
    <div style={{ margin: 0, padding: 0 }}>
      <EmbedTalk />
    </div>
  );
};

Embed.getLayout = function getLayout(page: React.ReactNode) {
  return <>{page}</>;
};

export default Embed;
